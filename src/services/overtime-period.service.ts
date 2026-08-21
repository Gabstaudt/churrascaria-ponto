import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduledOvertimePeriods } from "@/db/schema";
import type { OvertimePeriodCreateInput } from "@/validations/overtime-period";
import { recordAudit } from "./audit.service";
import { assertPeriodRangeMutable } from "./period-lock.service";

export async function listScheduledOvertimePeriods(employeeId: string, date: string) {
  return db
    .select()
    .from(scheduledOvertimePeriods)
    .where(and(eq(scheduledOvertimePeriods.employeeId, employeeId), eq(scheduledOvertimePeriods.date, date)))
    .orderBy(asc(scheduledOvertimePeriods.sequence));
}

export async function createScheduledOvertimePeriod(input: OvertimePeriodCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.date);
    const existing = await tx
      .select({ sequence: scheduledOvertimePeriods.sequence })
      .from(scheduledOvertimePeriods)
      .where(and(eq(scheduledOvertimePeriods.employeeId, input.employeeId), eq(scheduledOvertimePeriods.date, input.date)))
      .orderBy(asc(scheduledOvertimePeriods.sequence));
    const sequence = existing.length ? existing[existing.length - 1]!.sequence + 1 : 0;
    const [saved] = await tx
      .insert(scheduledOvertimePeriods)
      .values({ employeeId: input.employeeId, date: input.date, sequence, startTime: input.startTime, endTime: input.endTime, reason: input.reason, createdBy: performedBy })
      .returning();
    if (!saved) throw new Error("Não foi possível registrar o período de hora extra.");
    await recordAudit(tx, { action: "CREATE_SCHEDULED_OVERTIME_PERIOD", entity: "ScheduledOvertimePeriod", entityId: saved.id, performedBy, after: saved, reason: input.reason });
    return saved;
  });
}

export async function deleteScheduledOvertimePeriod(id: string, performedBy: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(scheduledOvertimePeriods).where(eq(scheduledOvertimePeriods.id, id)).limit(1);
    if (!current) return undefined;
    await assertPeriodRangeMutable(tx, current.date);
    await tx.delete(scheduledOvertimePeriods).where(eq(scheduledOvertimePeriods.id, id));
    await recordAudit(tx, { action: "DELETE_SCHEDULED_OVERTIME_PERIOD", entity: "ScheduledOvertimePeriod", entityId: id, performedBy, before: current, reason: "Exclusão administrativa" });
    return current;
  });
}
