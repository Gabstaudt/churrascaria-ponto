import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { employees, timeEntries } from "@/db/schema";
import type { SimulatedTimeEntriesInput } from "@/validations/time-entry";
import { localBelemDateTime, simulatedExternalId } from "./time-entry-core";
import { recordAudit } from "./audit.service";

export async function importSimulatedTimeEntries(input: SimulatedTimeEntriesInput, performedBy: string) {
  return db.transaction(async (tx) => {
    const values = input.times.map((time) => ({ employeeId: input.employeeId, occurredAt: localBelemDateTime(input.date, time), source: "SIMULATOR" as const, externalId: simulatedExternalId(input.employeeId, input.date, time), deviceIdentifier: "development-simulator", metadata: { timezone: "America/Belem", generatedBy: performedBy } }));
    const inserted = await tx.insert(timeEntries).values(values).onConflictDoNothing({ target: [timeEntries.source, timeEntries.externalId] }).returning();
    if (inserted.length) await recordAudit(tx, { action: "IMPORT_SIMULATED_TIME_ENTRIES", entity: "Employee", entityId: input.employeeId, performedBy, after: { date: input.date, requested: values.length, inserted: inserted.length, timeEntryIds: inserted.map((entry) => entry.id) }, reason: "Geração controlada para desenvolvimento" });
    return { requested: values.length, inserted: inserted.length, ignored: values.length - inserted.length };
  });
}

export async function listTimeEntries(input: { employeeId?: string; start?: Date; end?: Date; source?: "SIMULATOR" | "IMPORT" | "REP_C" } = {}) {
  const conditions = [];
  if (input.employeeId) conditions.push(eq(timeEntries.employeeId, input.employeeId));
  if (input.start) conditions.push(gte(timeEntries.occurredAt, input.start));
  if (input.end) conditions.push(lte(timeEntries.occurredAt, input.end));
  if (input.source) conditions.push(eq(timeEntries.source, input.source));
  return db.select({ id: timeEntries.id, employeeId: employees.id, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, position: employees.position, occurredAt: timeEntries.occurredAt, source: timeEntries.source, externalId: timeEntries.externalId, deviceIdentifier: timeEntries.deviceIdentifier, receivedAt: timeEntries.receivedAt })
    .from(timeEntries).innerJoin(employees, eq(employees.id, timeEntries.employeeId)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(timeEntries.occurredAt));
}

export async function listEmployeeTimeEntries(employeeId: string, limit = 100) {
  return db.select().from(timeEntries).where(eq(timeEntries.employeeId, employeeId)).orderBy(desc(timeEntries.occurredAt)).limit(limit);
}
