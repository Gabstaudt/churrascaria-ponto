import "server-only";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, timeAdjustments, timeEntries, users } from "@/db/schema";
import type { TimeAdjustmentInput } from "@/validations/time-adjustment";
import { officialDateTime } from "./daily-attendance-core";

export class InvalidOriginalEntryError extends Error { constructor() { super("A marcação original não pertence ao funcionário e à data informados."); this.name = "InvalidOriginalEntryError"; } }

export async function createTimeAdjustment(input: TimeAdjustmentInput, performedBy: string) {
  return db.transaction(async (tx) => {
    if (input.originalTimeEntryId) {
      const start = new Date(`${input.date}T00:00:00-03:00`); const end = new Date(`${input.date}T23:59:59.999-03:00`);
      const [entry] = await tx.select({ id: timeEntries.id }).from(timeEntries).where(and(eq(timeEntries.id, input.originalTimeEntryId), eq(timeEntries.employeeId, input.employeeId), gte(timeEntries.occurredAt, start), lte(timeEntries.occurredAt, end))).limit(1);
      if (!entry) throw new InvalidOriginalEntryError();
    }
    const [saved] = await tx.insert(timeAdjustments).values({ employeeId: input.employeeId, date: input.date, type: input.type, adjustedAt: input.time ? officialDateTime(input.date, input.time) : null, originalTimeEntryId: input.originalTimeEntryId, reason: input.reason, performedBy }).returning();
    if (!saved) throw new Error("Não foi possível registrar o tratamento.");
    await tx.insert(auditLogs).values({ action: "CREATE_TIME_ADJUSTMENT", entity: "TimeAdjustment", entityId: saved.id, performedBy, after: saved, reason: input.reason });
    return saved;
  });
}

export async function listTimeAdjustments(input: { employeeId?: string; date?: string } = {}) {
  const conditions = [];
  if (input.employeeId) conditions.push(eq(timeAdjustments.employeeId, input.employeeId));
  if (input.date) conditions.push(eq(timeAdjustments.date, input.date));
  return db.select({ id: timeAdjustments.id, employeeId: timeAdjustments.employeeId, date: timeAdjustments.date, type: timeAdjustments.type, adjustedAt: timeAdjustments.adjustedAt, originalTimeEntryId: timeAdjustments.originalTimeEntryId, reason: timeAdjustments.reason, createdAt: timeAdjustments.createdAt, performedByName: users.name }).from(timeAdjustments).innerJoin(users, eq(users.id, timeAdjustments.performedBy)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(timeAdjustments.createdAt));
}

export async function listAdjustmentsForPeriod(start: string, end: string) {
  return db.select().from(timeAdjustments).where(and(gte(timeAdjustments.date, start), lte(timeAdjustments.date, end))).orderBy(asc(timeAdjustments.createdAt));
}
