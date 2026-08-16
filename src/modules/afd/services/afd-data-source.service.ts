import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { employees, establishments, legalSettings, repRegistrars, timeEntries } from "@/db/schema";
import type { AfdSource } from "../types";

function boundary(date: string, endExclusive: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_PERIOD");
  const value = new Date(`${date}T00:00:00-03:00`);
  if (Number.isNaN(value.getTime())) throw new Error("INVALID_PERIOD");
  if (endExclusive) value.setUTCDate(value.getUTCDate() + 1);
  return value;
}

export async function loadAfdSource(registrarId: string, startDate: string, endDate: string): Promise<AfdSource> {
  if (startDate > endDate) throw new Error("INVALID_PERIOD");
  const [context] = await db.select({ registrar: repRegistrars, establishment: establishments }).from(repRegistrars).innerJoin(establishments, eq(establishments.id, repRegistrars.establishmentId)).where(eq(repRegistrars.id, registrarId)).limit(1);
  if (!context) throw new Error("REGISTRAR_NOT_FOUND");
  const [legal] = await db.select().from(legalSettings).limit(1);
  if (!legal) throw new Error("LEGAL_SETTINGS_REQUIRED");
  const rows = await db.select({ id: timeEntries.id, nsr: timeEntries.nsr, occurredAt: timeEntries.occurredAt, receivedAt: timeEntries.receivedAt, metadata: timeEntries.metadata, employeeCpf: employees.cpf }).from(timeEntries).innerJoin(employees, eq(employees.id, timeEntries.employeeId)).where(and(eq(timeEntries.source, "REP_P"), eq(timeEntries.registrarId, context.registrar.id), eq(timeEntries.establishmentId, context.establishment.id), gte(timeEntries.occurredAt, boundary(startDate, false)), lt(timeEntries.occurredAt, boundary(endDate, true)))).orderBy(asc(timeEntries.nsr));
  return { registrar: context.registrar, establishment: context.establishment, employer: { name: legal.employerName, idType: legal.employerIdType, id: legal.employerId, cno: legal.cno, caepf: legal.caepf }, developer: { idType: legal.developerIdType, id: legal.developerId }, entries: rows.map((row) => { if (!row.nsr || !/^\d+$/.test(row.nsr)) throw new Error("INVALID_NSR"); return { type: "7", sourceId: row.id, nsr: Number(row.nsr), markedAt: row.occurredAt, recordedAt: row.receivedAt, employeeCpf: row.employeeCpf, collectorType: "02", offline: row.metadata?.capturedOffline === true }; }) };
}
