import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { aejGenerations, closingPeriods, employees, establishments, repRegistrars, scheduleDays, timeAdjustments, timeBankEntries, timeEntries, workSchedules } from "@/db/schema";
import { legalAEJRecords, requireOfficialLegalSettings } from "@/services/legal-settings.service";
import { recordAudit } from "@/services/audit.service";
import { createPrivateDownloadUrl, getPrivateObjectBytes, putPrivateObject } from "@/services/object-storage.service";
import { AEJ_LAYOUT_VERSION, generateAejArtifact, type AejGenerationSource } from "../generators/aej.generator";
import { validateAejBytes } from "../validators/aej.validator";

function hash(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function localOfficialTimestamp(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Belem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:00-0300`;
}
function minutes(time: string) { const [hour, minute] = time.slice(0, 5).split(":").map(Number); return hour * 60 + minute; }
function pairs(day: typeof scheduleDays.$inferSelect): Array<[string, string]> {
  if (!day.startTime || !day.endTime) return [];
  const compact = (time: string) => time.slice(0, 5).replace(":", "");
  return day.breakStartTime && day.breakEndTime ? [[compact(day.startTime), compact(day.breakStartTime)], [compact(day.breakEndTime), compact(day.endTime)]] : [[compact(day.startTime), compact(day.endTime)]];
}
function duration(day: typeof scheduleDays.$inferSelect) { if (!day.startTime || !day.endTime) return 0; return minutes(day.endTime) - minutes(day.startTime) - (day.breakStartTime && day.breakEndTime ? minutes(day.breakEndTime) - minutes(day.breakStartTime) : 0); }

async function loadAejSource(period: typeof closingPeriods.$inferSelect, now: Date) {
  const legal = await requireOfficialLegalSettings();
  const start = new Date(`${period.startDate}T00:00:00-03:00`); const end = new Date(`${period.endDate}T23:59:59.999-03:00`);
  const [entries, adjustments, bank] = await Promise.all([
    db.select().from(timeEntries).where(and(gte(timeEntries.occurredAt, start), lte(timeEntries.occurredAt, end))).orderBy(asc(timeEntries.occurredAt), asc(timeEntries.createdAt)),
    db.select().from(timeAdjustments).where(and(gte(timeAdjustments.date, period.startDate), lte(timeAdjustments.date, period.endDate))).orderBy(asc(timeAdjustments.date), asc(timeAdjustments.createdAt)),
    db.select().from(timeBankEntries).where(and(gte(timeBankEntries.referenceDate, period.startDate), lte(timeBankEntries.referenceDate, period.endDate))).orderBy(asc(timeBankEntries.referenceDate), asc(timeBankEntries.createdAt)),
  ]);
  if (entries.some((entry) => entry.source === "SIMULATOR")) throw new Error("AEJ_DEVELOPMENT_ENTRIES_BLOCKED");
  const employeeIds = [...new Set([...entries.map((item) => item.employeeId), ...adjustments.map((item) => item.employeeId), ...bank.map((item) => item.employeeId)])];
  if (!employeeIds.length) throw new Error("AEJ_PERIOD_WITHOUT_EMPLOYEES");
  const [employeeRows, schedules] = await Promise.all([
    db.select().from(employees).where(inArray(employees.id, employeeIds)).orderBy(asc(employees.fullName)),
    db.select({ schedule: workSchedules, day: scheduleDays }).from(workSchedules).innerJoin(scheduleDays, eq(scheduleDays.workScheduleId, workSchedules.id)).where(and(inArray(workSchedules.employeeId, employeeIds), lte(workSchedules.validFrom, period.endDate), or(isNull(workSchedules.validTo), gte(workSchedules.validTo, period.startDate)))).orderBy(asc(workSchedules.validFrom), asc(scheduleDays.dayOfWeek)),
  ]);
  const employeeSource = employeeRows.map((employee, index) => {
    const scheduleRows = schedules.filter((row) => row.schedule.employeeId === employee.id && row.day.isWorkDay && row.day.startTime && row.day.endTime);
    const representative = scheduleRows[0]?.day;
    if (!representative) throw new Error(`AEJ_SCHEDULE_MISSING:${employee.registrationNumber}`);
    return { id: employee.id, cpf: employee.cpf, name: employee.fullName, registrationNumber: employee.registrationNumber, scheduleCode: `J${String(index + 1).padStart(4, "0")}`, scheduleMinutes: duration(representative), schedulePairs: pairs(representative) };
  });
  const scheduleByEmployee = new Map(employeeSource.map((employee) => [employee.id, employee.scheduleCode]));
  const registrarIds = [...new Set(entries.flatMap((entry) => entry.registrarId ? [entry.registrarId] : []))];
  const registrars = registrarIds.length ? await db.select().from(repRegistrars).where(inArray(repRegistrars.id, registrarIds)).orderBy(asc(repRegistrars.identifier)) : [];
  if (registrars.some((registrar) => !registrar.inpiRegistration || !/^\d{17}$/.test(registrar.inpiRegistration))) throw new Error("AEJ_REP_REGISTRATION_INVALID");
  const ignored = new Map(adjustments.filter((item) => item.type === "IGNORE_ENTRY" && item.originalTimeEntryId).map((item) => [item.originalTimeEntryId!, item]));
  const normalized: AejGenerationSource["entries"] = entries.flatMap((entry, index) => {
    const eventType = entry.metadata?.eventType; const kind = eventType === "EXIT" ? "S" : eventType === "ENTRY" ? "E" : index % 2 === 0 ? "E" : "S";
    const base = { employeeId: entry.employeeId, occurredAt: localOfficialTimestamp(entry.occurredAt), registrarId: entry.registrarId ?? undefined, kind: kind as "E" | "S", source: "O" as const, scheduleCode: scheduleByEmployee.get(entry.employeeId) };
    const treatment = ignored.get(entry.id); return treatment ? [base, { ...base, kind: "D" as const, reason: treatment.reason }] : [base];
  });
  for (const adjustment of adjustments.filter((item) => item.adjustedAt && ["ADD_ENTRY", "FORGOTTEN_EXIT"].includes(item.type))) normalized.push({ employeeId: adjustment.employeeId, occurredAt: localOfficialTimestamp(adjustment.adjustedAt!), kind: adjustment.type === "FORGOTTEN_EXIT" ? "S" : "E", source: "I", scheduleCode: scheduleByEmployee.get(adjustment.employeeId), reason: adjustment.reason });
  normalized.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  return { legalRecords: legalAEJRecords(legal, period.startDate, period.endDate, localOfficialTimestamp(now)) as [ReturnType<typeof legalAEJRecords>[0], ReturnType<typeof legalAEJRecords>[1]], registrars: registrars.map((registrar) => ({ id: registrar.id, inpiRegistration: registrar.inpiRegistration! })), employees: employeeSource, entries: normalized, bank: bank.map((entry) => ({ employeeId: entry.employeeId, date: entry.referenceDate, minutes: entry.amountMinutes })) };
}

export async function generateOfficialAej(closingPeriodId: string, generatedBy: string) {
  const [period] = await db.select().from(closingPeriods).where(eq(closingPeriods.id, closingPeriodId)).limit(1); if (!period || period.status !== "CLOSED") throw new Error("AEJ_REQUIRES_CLOSED_PERIOD");
  const [establishment] = await db.select().from(establishments).where(eq(establishments.isActive, true)).orderBy(asc(establishments.createdAt)).limit(1); if (!establishment) throw new Error("AEJ_ESTABLISHMENT_MISSING");
  const existing = (await db.select().from(aejGenerations).where(and(eq(aejGenerations.closingPeriodId, period.id), eq(aejGenerations.revision, period.currentRevision))).limit(1))[0]; if (existing) return existing;
  const now = new Date(); const source = await loadAejSource(period, now); const artifact = generateAejArtifact(source); const issues = validateAejBytes(artifact.bytes); if (issues.some((issue) => issue.severity === "ERROR")) throw new Error("AEJ_VALIDATION_FAILED");
  const fileHash = hash(artifact.bytes); const fileName = `AEJ-${period.referenceMonth}-R${period.currentRevision}.txt`; const fileKey = `official-documents/aej/${establishment.id}/${period.referenceMonth}/${period.currentRevision}/${fileName}`;
  await putPrivateObject(fileKey, artifact.bytes, "text/plain; charset=iso-8859-1", { sha256: fileHash, layoutVersion: AEJ_LAYOUT_VERSION, closingPeriodId: period.id, revision: String(period.currentRevision) }); const stored = await getPrivateObjectBytes(fileKey); if (hash(stored) !== fileHash || validateAejBytes(stored).some((issue) => issue.severity === "ERROR")) throw new Error("AEJ_POST_STORAGE_VALIDATION_FAILED");
  const [generation] = await db.insert(aejGenerations).values({ establishmentId: establishment.id, closingPeriodId: period.id, revision: period.currentRevision, startDate: period.startDate, endDate: period.endDate, layoutVersion: AEJ_LAYOUT_VERSION, status: "GENERATED", fileName, fileKey, fileHash, validationIssues: issues, generatedBy, generatedAt: now }).returning(); if (!generation) throw new Error("AEJ_GENERATION_NOT_SAVED");
  await db.update(aejGenerations).set({ status: "SUPERSEDED" }).where(and(eq(aejGenerations.closingPeriodId, period.id), lte(aejGenerations.revision, period.currentRevision - 1)));
  await recordAudit(db, { action: "AEJ_GENERATED", entity: "AEJ_GENERATION", entityId: generation.id, performedBy: generatedBy, after: { fileHash, layoutVersion: AEJ_LAYOUT_VERSION, revision: period.currentRevision, recordCount: artifact.recordCount } }); return generation;
}
export async function listAejGenerations() { return db.select({ generation: aejGenerations, establishmentName: establishments.name, referenceMonth: closingPeriods.referenceMonth }).from(aejGenerations).innerJoin(establishments, eq(establishments.id, aejGenerations.establishmentId)).innerJoin(closingPeriods, eq(closingPeriods.id, aejGenerations.closingPeriodId)).orderBy(desc(aejGenerations.createdAt)); }
export async function getAejGeneration(id: string) { return (await db.select().from(aejGenerations).where(eq(aejGenerations.id, id)).limit(1))[0]; }
export async function getAejGenerationDetail(id: string) { const [row] = await db.select({ generation: aejGenerations, establishmentName: establishments.name, referenceMonth: closingPeriods.referenceMonth }).from(aejGenerations).innerJoin(establishments, eq(establishments.id, aejGenerations.establishmentId)).innerJoin(closingPeriods, eq(closingPeriods.id, aejGenerations.closingPeriodId)).where(eq(aejGenerations.id, id)).limit(1); return row; }
export async function downloadAej(id: string, performedBy: string) { const generation = await getAejGeneration(id); if (!generation || !["SIGNED", "SUPERSEDED"].includes(generation.status) || generation.signatureStatus !== "SIGNED") return undefined; const bytes = await getPrivateObjectBytes(generation.fileKey); if (hash(bytes) !== generation.fileHash) throw new Error("AEJ_INTEGRITY_MISMATCH"); await recordAudit(db, { action: "AEJ_DOWNLOADED", entity: "AEJ_GENERATION", entityId: id, performedBy, after: { fileHash: generation.fileHash, revision: generation.revision } }); return createPrivateDownloadUrl(generation.fileKey, generation.fileName); }
