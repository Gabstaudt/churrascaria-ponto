import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { employees, timeEntries } from "@/db/schema";

export async function listTimeEntries(input: { employeeId?: string; start?: Date; end?: Date; source?: "SIMULATOR" | "IMPORT" | "REP_C" | "REP_P" } = {}) {
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
