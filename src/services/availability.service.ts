import "server-only";

import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, dayOffSwaps, daysOff, employees, leavePeriods, vacations } from "@/db/schema";
import type { AvailabilityCreateInput } from "@/validations/availability";

export class AvailabilityConflictError extends Error {
  constructor(message = "Já existe férias ou afastamento nesse período para o funcionário.") { super(message); this.name = "AvailabilityConflictError"; }
}

async function hasPeriodConflict(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], employeeId: string, start: string, end: string) {
  const vacation = await tx.select({ id: vacations.id }).from(vacations).where(and(eq(vacations.employeeId, employeeId), lte(vacations.startDate, end), gte(vacations.endDate, start))).limit(1);
  const leave = await tx.select({ id: leavePeriods.id }).from(leavePeriods).where(and(eq(leavePeriods.employeeId, employeeId), lte(leavePeriods.startDate, end), gte(leavePeriods.endDate, start))).limit(1);
  const off = await tx.select({ id: daysOff.id }).from(daysOff).where(and(eq(daysOff.employeeId, employeeId), gte(daysOff.date, start), lte(daysOff.date, end))).limit(1);
  const swap = await tx.select({ id: dayOffSwaps.id }).from(dayOffSwaps).where(and(eq(dayOffSwaps.employeeId, employeeId), eq(dayOffSwaps.status, "APPROVED"), or(and(gte(dayOffSwaps.dayOffDate, start), lte(dayOffSwaps.dayOffDate, end)), and(gte(dayOffSwaps.workDate, start), lte(dayOffSwaps.workDate, end))))).limit(1);
  return vacation.length > 0 || leave.length > 0 || off.length > 0 || swap.length > 0;
}

export async function createAvailability(input: AvailabilityCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
    if (input.kind === "DAY_OFF") {
      const [existing] = await tx.select().from(daysOff).where(and(eq(daysOff.employeeId, input.employeeId), eq(daysOff.date, input.date!))).limit(1);
      if (!existing && await hasPeriodConflict(tx, input.employeeId, input.date!, input.date!)) throw new AvailabilityConflictError("A folga conflita com outro período ou troca aprovada.");
      const [saved] = existing ? await tx.update(daysOff).set({ reason: input.reason, authorizedBy: performedBy }).where(eq(daysOff.id, existing.id)).returning() : await tx.insert(daysOff).values({ employeeId: input.employeeId, date: input.date!, reason: input.reason, authorizedBy: performedBy }).returning();
      await tx.insert(auditLogs).values({ action: existing ? "UPDATE_DAY_OFF" : "CREATE_DAY_OFF", entity: "DayOff", entityId: saved!.id, performedBy, before: existing ?? null, after: saved!, reason: input.reason });
      return saved;
    }
    if (input.kind === "SWAP") {
      const [saved] = await tx.insert(dayOffSwaps).values({ employeeId: input.employeeId, dayOffDate: input.date!, workDate: input.workDate!, reason: input.reason, requestedBy: performedBy }).returning();
      await tx.insert(auditLogs).values({ action: "REQUEST_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
      return saved;
    }
    if (await hasPeriodConflict(tx, input.employeeId, input.startDate!, input.endDate!)) throw new AvailabilityConflictError();
    if (input.kind === "VACATION") {
      const [saved] = await tx.insert(vacations).values({ employeeId: input.employeeId, startDate: input.startDate!, endDate: input.endDate!, reason: input.reason, authorizedBy: performedBy }).returning();
      await tx.insert(auditLogs).values({ action: "CREATE_VACATION", entity: "Vacation", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
      return saved;
    }
    const [saved] = await tx.insert(leavePeriods).values({ employeeId: input.employeeId, type: input.leaveType!, startDate: input.startDate!, endDate: input.endDate!, reason: input.reason, authorizedBy: performedBy }).returning();
    await tx.insert(auditLogs).values({ action: "CREATE_LEAVE_PERIOD", entity: "LeavePeriod", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
    return saved;
  });
}

export async function reviewDayOffSwap(id: string, decision: "APPROVED" | "REJECTED", reason: string, performedBy: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1);
    if (!current || current.status !== "PENDING") return undefined;
    if (decision === "APPROVED" && (await hasPeriodConflict(tx, current.employeeId, current.dayOffDate, current.workDate))) throw new AvailabilityConflictError("A troca conflita com férias ou afastamento do funcionário.");
    const [saved] = await tx.update(dayOffSwaps).set({ status: decision, reviewedBy: performedBy, reviewedAt: new Date(), reviewReason: reason }).where(eq(dayOffSwaps.id, id)).returning();
    await tx.insert(auditLogs).values({ action: decision === "APPROVED" ? "APPROVE_DAY_OFF_SWAP" : "REJECT_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: id, performedBy, before: current, after: saved!, reason });
    return saved;
  });
}

export async function listAvailability() {
  const [off, swaps, vacationRows, leaves] = await Promise.all([
    db.select({ id: daysOff.id, employeeId: employees.id, employeeName: employees.fullName, position: employees.position, date: daysOff.date, reason: daysOff.reason }).from(daysOff).innerJoin(employees, eq(employees.id, daysOff.employeeId)).orderBy(desc(daysOff.date)),
    db.select({ id: dayOffSwaps.id, employeeId: employees.id, employeeName: employees.fullName, position: employees.position, dayOffDate: dayOffSwaps.dayOffDate, workDate: dayOffSwaps.workDate, reason: dayOffSwaps.reason, status: dayOffSwaps.status }).from(dayOffSwaps).innerJoin(employees, eq(employees.id, dayOffSwaps.employeeId)).orderBy(desc(dayOffSwaps.createdAt)),
    db.select({ id: vacations.id, employeeId: employees.id, employeeName: employees.fullName, position: employees.position, startDate: vacations.startDate, endDate: vacations.endDate, reason: vacations.reason }).from(vacations).innerJoin(employees, eq(employees.id, vacations.employeeId)).orderBy(desc(vacations.startDate)),
    db.select({ id: leavePeriods.id, employeeId: employees.id, employeeName: employees.fullName, position: employees.position, startDate: leavePeriods.startDate, endDate: leavePeriods.endDate, reason: leavePeriods.reason, type: leavePeriods.type }).from(leavePeriods).innerJoin(employees, eq(employees.id, leavePeriods.employeeId)).orderBy(desc(leavePeriods.startDate)),
  ]);
  return { daysOff: off, swaps, vacations: vacationRows, leaves };
}
