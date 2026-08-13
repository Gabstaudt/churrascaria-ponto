import "server-only";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { closingPeriodEvents, closingPeriods, closingPeriodSummaries, employees, timeBankEntries, users } from "@/db/schema";
import { recordAudit } from "./audit.service";
import { getDailyAttendance } from "./daily-attendance.service";
import { getDailyAttendanceCalculation } from "./attendance.service";
import { canTransitionClosingPeriod, hasCriticalClosingBlockers, monthBounds, type ClosingStatus } from "./closing-period-core";

function datesBetween(start: string, end: string) { const result: string[] = []; const date = new Date(`${start}T00:00:00Z`); const last = new Date(`${end}T00:00:00Z`); while (date <= last) { result.push(date.toISOString().slice(0, 10)); date.setUTCDate(date.getUTCDate() + 1); } return result; }
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Belem" }).format(new Date()); }

export async function analyzeClosingPeriod(startDate: string, endDate: string) {
  const bankEntries = await db.select({ employeeId: timeBankEntries.employeeId, date: timeBankEntries.referenceDate, amount: timeBankEntries.amountMinutes, calculated: timeBankEntries.calculatedDailyMinutes }).from(timeBankEntries).where(and(gte(timeBankEntries.referenceDate, startDate), lte(timeBankEntries.referenceDate, endDate)));
  const processed = new Set(bankEntries.filter((item) => item.calculated !== null).map((item) => `${item.employeeId}:${item.date}`));
  const summaries = new Map<string, { employeeId: string; employeeName: string; registrationNumber: string; plannedMinutes: number; workedMinutes: number; lateMinutes: number; earlyDepartureMinutes: number; overtimeMinutes: number; absenceDays: number; justifiedAbsenceDays: number; timeBankMinutes: number }>();
  let incomplete = 0; let possibleAbsences = 0; let unprocessedBank = 0; let noSchedule = 0;
  for (const date of datesBetween(startDate, endDate)) {
    const daily = await getDailyAttendance(date);
    for (const row of daily.rows) {
      const summary = summaries.get(row.employee.id) ?? { employeeId: row.employee.id, employeeName: row.employee.fullName, registrationNumber: row.employee.registrationNumber, plannedMinutes: 0, workedMinutes: 0, lateMinutes: 0, earlyDepartureMinutes: 0, overtimeMinutes: 0, absenceDays: 0, justifiedAbsenceDays: 0, timeBankMinutes: 0 };
      if (row.status === "INCOMPLETE") incomplete++;
      if (row.status === "POSSIBLE_ABSENCE") possibleAbsences++;
      if (row.status === "NO_SCHEDULE") noSchedule++;
      if (row.status === "ABSENCE_UNJUSTIFIED") summary.absenceDays++;
      if (row.status === "ABSENCE_JUSTIFIED") summary.justifiedAbsenceDays++;
      if (["PRESENT", "LATE", "LATE_JUSTIFIED"].includes(row.status)) {
        const attendance = await getDailyAttendanceCalculation(row.employee.id, date);
        if (attendance) {
          summary.plannedMinutes += attendance.calculation.plannedMinutes;
          summary.workedMinutes += attendance.calculation.workedMinutes;
          summary.lateMinutes += attendance.calculation.delayMinutes ?? 0;
          summary.earlyDepartureMinutes += attendance.calculation.earlyDepartureMinutes ?? 0;
          summary.overtimeMinutes += attendance.calculation.overtimeMinutes ?? 0;
          if (attendance.calculation.status === "COMPLETE" && !processed.has(`${row.employee.id}:${date}`)) unprocessedBank++;
        }
      }
      summaries.set(row.employee.id, summary);
    }
  }
  for (const entry of bankEntries) { const summary = summaries.get(entry.employeeId); if (summary) summary.timeBankMinutes += entry.amount; }
  const blockers = [
    { code: "PERIOD_NOT_FINISHED", label: "Competência ainda não encerrada no calendário", severity: "CRITICAL" as const, count: endDate >= today() ? 1 : 0 },
    { code: "INCOMPLETE_ENTRIES", label: "Dias com pares de ponto incompletos", severity: "CRITICAL" as const, count: incomplete },
    { code: "POSSIBLE_ABSENCES", label: "Possíveis ausências sem decisão", severity: "CRITICAL" as const, count: possibleAbsences },
    { code: "UNPROCESSED_TIME_BANK", label: "Dias completos sem processamento no banco de horas", severity: "CRITICAL" as const, count: unprocessedBank },
    { code: "NO_SCHEDULE", label: "Dias sem jornada configurada", severity: "WARNING" as const, count: noSchedule },
  ];
  return { blockers, hasCriticalBlockers: hasCriticalClosingBlockers(blockers), summaries: [...summaries.values()].sort((a, b) => a.employeeName.localeCompare(b.employeeName, "pt-BR")) };
}

export async function createClosingPeriod(referenceMonth: string, performedBy: string) {
  const bounds = monthBounds(referenceMonth);
  return db.transaction(async (tx) => {
    const [period] = await tx.insert(closingPeriods).values({ referenceMonth, ...bounds, createdBy: performedBy }).returning();
    if (!period) throw new Error("Não foi possível criar a competência.");
    await tx.insert(closingPeriodEvents).values({ periodId: period.id, event: "CREATED", toStatus: "OPEN", performedBy });
    await recordAudit(tx, { action: "CREATE_CLOSING_PERIOD", entity: "ClosingPeriod", entityId: period.id, performedBy, after: { referenceMonth, ...bounds, status: "OPEN" } });
    return period;
  });
}

async function transitionPeriod(id: string, expected: ClosingStatus, next: ClosingStatus, event: "SENT_TO_REVIEW" | "REOPENED", performedBy: string, reason?: string) {
  if (!canTransitionClosingPeriod(expected, next)) throw new Error("Transição inválida.");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`closing:${id}`}))`);
    const [current] = await tx.select().from(closingPeriods).where(eq(closingPeriods.id, id)).limit(1);
    if (!current || current.status !== expected) throw new Error("A competência mudou de estado. Atualize a página.");
    const values = next === "IN_REVIEW" ? { status: next, reviewedBy: performedBy, reviewedAt: new Date(), updatedAt: new Date() } : { status: next, reviewedBy: null, reviewedAt: null, closedBy: null, closedAt: null, updatedAt: new Date() };
    const [updated] = await tx.update(closingPeriods).set(values).where(eq(closingPeriods.id, id)).returning();
    await tx.insert(closingPeriodEvents).values({ periodId: id, event, fromStatus: expected, toStatus: next, reason: reason ?? null, performedBy });
    await recordAudit(tx, { action: event === "REOPENED" ? "REOPEN_CLOSING_PERIOD" : "REVIEW_CLOSING_PERIOD", entity: "ClosingPeriod", entityId: id, performedBy, before: { status: expected, revision: current.currentRevision }, after: { status: next, revision: current.currentRevision }, reason });
    return updated;
  });
}

export function sendClosingPeriodToReview(id: string, performedBy: string) { return transitionPeriod(id, "OPEN", "IN_REVIEW", "SENT_TO_REVIEW", performedBy); }
export function reopenClosingPeriod(id: string, reason: string, performedBy: string) { return transitionPeriod(id, "CLOSED", "OPEN", "REOPENED", performedBy, reason); }

export async function closeClosingPeriod(id: string, performedBy: string) {
  const [period] = await db.select().from(closingPeriods).where(eq(closingPeriods.id, id)).limit(1);
  if (!period || period.status !== "IN_REVIEW") throw new Error("A competência deve estar em revisão.");
  const analysis = await analyzeClosingPeriod(period.startDate, period.endDate);
  if (analysis.hasCriticalBlockers) throw new Error("Existem pendências críticas que impedem o fechamento.");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`closing:${id}`}))`);
    const [current] = await tx.select().from(closingPeriods).where(eq(closingPeriods.id, id)).limit(1);
    if (!current || current.status !== "IN_REVIEW") throw new Error("A competência mudou de estado.");
    const revision = current.currentRevision + 1;
    if (analysis.summaries.length) await tx.insert(closingPeriodSummaries).values(analysis.summaries.map((item) => ({ periodId: id, employeeId: item.employeeId, revision, plannedMinutes: item.plannedMinutes, workedMinutes: item.workedMinutes, lateMinutes: item.lateMinutes, earlyDepartureMinutes: item.earlyDepartureMinutes, overtimeMinutes: item.overtimeMinutes, absenceDays: item.absenceDays, justifiedAbsenceDays: item.justifiedAbsenceDays, timeBankMinutes: item.timeBankMinutes, metadata: { calculationVersion: "attendance-v1" } })));
    const [updated] = await tx.update(closingPeriods).set({ status: "CLOSED", currentRevision: revision, closedBy: performedBy, closedAt: new Date(), updatedAt: new Date() }).where(eq(closingPeriods.id, id)).returning();
    await tx.insert(closingPeriodEvents).values({ periodId: id, event: "CLOSED", fromStatus: "IN_REVIEW", toStatus: "CLOSED", reason: `Snapshot da revisão ${revision}`, performedBy });
    await recordAudit(tx, { action: "CLOSE_CLOSING_PERIOD", entity: "ClosingPeriod", entityId: id, performedBy, before: { status: "IN_REVIEW", revision: current.currentRevision }, after: { status: "CLOSED", revision, employees: analysis.summaries.length }, reason: `Competência ${current.referenceMonth} fechada` });
    return updated;
  });
}

export async function listClosingPeriods() { return db.select().from(closingPeriods).orderBy(desc(closingPeriods.referenceMonth)); }
export async function getClosingPeriod(id: string) { const [period] = await db.select().from(closingPeriods).where(eq(closingPeriods.id, id)).limit(1); return period; }
export async function getClosingPeriodEvents(id: string) { return db.select({ id: closingPeriodEvents.id, event: closingPeriodEvents.event, fromStatus: closingPeriodEvents.fromStatus, toStatus: closingPeriodEvents.toStatus, reason: closingPeriodEvents.reason, performedByName: users.name, createdAt: closingPeriodEvents.createdAt }).from(closingPeriodEvents).innerJoin(users, eq(users.id, closingPeriodEvents.performedBy)).where(eq(closingPeriodEvents.periodId, id)).orderBy(desc(closingPeriodEvents.createdAt)); }
export async function getClosingPeriodSummaries(id: string, revision: number) { return db.select({ id: closingPeriodSummaries.id, employeeId: closingPeriodSummaries.employeeId, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, plannedMinutes: closingPeriodSummaries.plannedMinutes, workedMinutes: closingPeriodSummaries.workedMinutes, lateMinutes: closingPeriodSummaries.lateMinutes, earlyDepartureMinutes: closingPeriodSummaries.earlyDepartureMinutes, overtimeMinutes: closingPeriodSummaries.overtimeMinutes, absenceDays: closingPeriodSummaries.absenceDays, justifiedAbsenceDays: closingPeriodSummaries.justifiedAbsenceDays, timeBankMinutes: closingPeriodSummaries.timeBankMinutes }).from(closingPeriodSummaries).innerJoin(employees, eq(employees.id, closingPeriodSummaries.employeeId)).where(and(eq(closingPeriodSummaries.periodId, id), eq(closingPeriodSummaries.revision, revision))).orderBy(asc(employees.fullName)); }
