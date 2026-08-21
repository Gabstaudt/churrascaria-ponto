import "server-only";

import { and, desc, eq, gte, lte, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { dayOffSwaps, daysOff, employees, leavePeriods, vacations } from "@/db/schema";
import type { AvailabilityCreateInput, AvailabilityKind } from "@/validations/availability";
import { recordAudit } from "./audit.service";
import { assertPeriodRangeMutable } from "./period-lock.service";
import { createManualTimeBankAdjustment } from "./time-bank.service";

export class AvailabilityConflictError extends Error {
  constructor(message = "Já existe férias ou afastamento nesse período para o funcionário.") { super(message); this.name = "AvailabilityConflictError"; }
}

async function hasPeriodConflict(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], employeeId: string, start: string, end: string, exclude?: { kind: AvailabilityKind; id: string }) {
  const vacationConditions = [eq(vacations.employeeId, employeeId), lte(vacations.startDate, end), gte(vacations.endDate, start)];
  if (exclude?.kind === "VACATION") vacationConditions.push(ne(vacations.id, exclude.id));
  const vacation = await tx.select({ id: vacations.id }).from(vacations).where(and(...vacationConditions)).limit(1);

  const leaveConditions = [eq(leavePeriods.employeeId, employeeId), lte(leavePeriods.startDate, end), gte(leavePeriods.endDate, start)];
  if (exclude?.kind === "LEAVE") leaveConditions.push(ne(leavePeriods.id, exclude.id));
  const leave = await tx.select({ id: leavePeriods.id }).from(leavePeriods).where(and(...leaveConditions)).limit(1);

  const offConditions = [eq(daysOff.employeeId, employeeId), gte(daysOff.date, start), lte(daysOff.date, end)];
  if (exclude?.kind === "DAY_OFF") offConditions.push(ne(daysOff.id, exclude.id));
  const off = await tx.select({ id: daysOff.id }).from(daysOff).where(and(...offConditions)).limit(1);

  const swapConditions = [eq(dayOffSwaps.employeeId, employeeId), eq(dayOffSwaps.status, "APPROVED" as const), or(and(gte(dayOffSwaps.dayOffDate, start), lte(dayOffSwaps.dayOffDate, end)), and(gte(dayOffSwaps.workDate, start), lte(dayOffSwaps.workDate, end)))!];
  if (exclude?.kind === "SWAP") swapConditions.push(ne(dayOffSwaps.id, exclude.id));
  const swap = await tx.select({ id: dayOffSwaps.id }).from(dayOffSwaps).where(and(...swapConditions)).limit(1);

  return vacation.length > 0 || leave.length > 0 || off.length > 0 || swap.length > 0;
}

export async function createAvailability(input: AvailabilityCreateInput, performedBy: string) {
  const saved = await db.transaction(async (tx) => {
    const dates = input.kind === "DAY_OFF" ? [input.date!, input.date!] : input.kind === "SWAP" ? [input.date! < input.workDate! ? input.date! : input.workDate!, input.date! > input.workDate! ? input.date! : input.workDate!] : [input.startDate!, input.endDate!];
    await assertPeriodRangeMutable(tx, dates[0], dates[1]);
    if (input.kind === "DAY_OFF") {
      const [existing] = await tx.select().from(daysOff).where(and(eq(daysOff.employeeId, input.employeeId), eq(daysOff.date, input.date!))).limit(1);
      if (!existing && await hasPeriodConflict(tx, input.employeeId, input.date!, input.date!)) throw new AvailabilityConflictError("A folga conflita com outro período ou troca aprovada.");
      const [saved] = existing ? await tx.update(daysOff).set({ reason: input.reason, authorizedBy: performedBy }).where(eq(daysOff.id, existing.id)).returning() : await tx.insert(daysOff).values({ employeeId: input.employeeId, date: input.date!, reason: input.reason, authorizedBy: performedBy }).returning();
      await recordAudit(tx, { action: existing ? "UPDATE_DAY_OFF" : "CREATE_DAY_OFF", entity: "DayOff", entityId: saved!.id, performedBy, before: existing ?? null, after: saved!, reason: input.reason });
      return { saved, isNewDayOff: !existing };
    }
    if (input.kind === "SWAP") {
      const [saved] = await tx.insert(dayOffSwaps).values({ employeeId: input.employeeId, dayOffDate: input.date!, workDate: input.workDate!, reason: input.reason, requestedBy: performedBy }).returning();
      await recordAudit(tx, { action: "REQUEST_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
      return saved;
    }
    if (await hasPeriodConflict(tx, input.employeeId, input.startDate!, input.endDate!)) throw new AvailabilityConflictError();
    if (input.kind === "VACATION") {
      const [saved] = await tx.insert(vacations).values({ employeeId: input.employeeId, startDate: input.startDate!, endDate: input.endDate!, reason: input.reason, authorizedBy: performedBy }).returning();
      await recordAudit(tx, { action: "CREATE_VACATION", entity: "Vacation", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
      return saved;
    }
    const [saved] = await tx.insert(leavePeriods).values({ employeeId: input.employeeId, type: input.leaveType!, startDate: input.startDate!, endDate: input.endDate!, reason: input.reason, authorizedBy: performedBy }).returning();
    await recordAudit(tx, { action: "CREATE_LEAVE_PERIOD", entity: "LeavePeriod", entityId: saved!.id, performedBy, after: saved!, reason: input.reason });
    return saved;
  });
  if (input.kind === "DAY_OFF") {
    const { saved: dayOff, isNewDayOff } = saved as { saved: typeof daysOff.$inferSelect; isNewDayOff: boolean };
    if (isNewDayOff && input.timeBankDebitMinutes) await createManualTimeBankAdjustment({ employeeId: input.employeeId, date: input.date!, amountMinutes: -input.timeBankDebitMinutes, reason: `Folga compensatória — abate de banco de horas referente a ${input.date}.` }, performedBy);
    return dayOff;
  }
  return saved;
}

export async function reviewDayOffSwap(id: string, decision: "APPROVED" | "REJECTED", reason: string, performedBy: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1);
    if (!current || current.status !== "PENDING") return undefined;
    await assertPeriodRangeMutable(tx, current.dayOffDate < current.workDate ? current.dayOffDate : current.workDate, current.dayOffDate > current.workDate ? current.dayOffDate : current.workDate);
    if (decision === "APPROVED" && (await hasPeriodConflict(tx, current.employeeId, current.dayOffDate, current.workDate))) throw new AvailabilityConflictError("A troca conflita com férias ou afastamento do funcionário.");
    const [saved] = await tx.update(dayOffSwaps).set({ status: decision, reviewedBy: performedBy, reviewedAt: new Date(), reviewReason: reason }).where(eq(dayOffSwaps.id, id)).returning();
    await recordAudit(tx, { action: decision === "APPROVED" ? "APPROVE_DAY_OFF_SWAP" : "REJECT_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: id, performedBy, before: current, after: saved!, reason });
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

export async function getAvailabilityRecord(kind: AvailabilityKind, id: string) {
  if (kind === "DAY_OFF") return (await db.select().from(daysOff).where(eq(daysOff.id, id)).limit(1))[0];
  if (kind === "SWAP") return (await db.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1))[0];
  if (kind === "VACATION") return (await db.select().from(vacations).where(eq(vacations.id, id)).limit(1))[0];
  return (await db.select().from(leavePeriods).where(eq(leavePeriods.id, id)).limit(1))[0];
}

export async function updateAvailability(kind: AvailabilityKind, id: string, input: AvailabilityCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
    if (kind === "DAY_OFF") {
      const [current] = await tx.select().from(daysOff).where(eq(daysOff.id, id)).limit(1);
      if (!current) return undefined;
      const bounds = [current.date, input.date!].sort();
      await assertPeriodRangeMutable(tx, bounds[0]!, bounds[1]!);
      if (input.date !== current.date) {
        const [sameDate] = await tx.select({ id: daysOff.id }).from(daysOff).where(and(eq(daysOff.employeeId, input.employeeId), eq(daysOff.date, input.date!), ne(daysOff.id, id))).limit(1);
        if (sameDate) throw new AvailabilityConflictError("Já existe uma folga cadastrada para essa data.");
      }
      if (await hasPeriodConflict(tx, input.employeeId, input.date!, input.date!, { kind: "DAY_OFF", id })) throw new AvailabilityConflictError("A folga conflita com outro período ou troca aprovada.");
      const [saved] = await tx.update(daysOff).set({ date: input.date!, reason: input.reason, authorizedBy: performedBy }).where(eq(daysOff.id, id)).returning();
      await recordAudit(tx, { action: "UPDATE_DAY_OFF", entity: "DayOff", entityId: id, performedBy, before: current, after: saved!, reason: input.reason });
      return saved;
    }
    if (kind === "SWAP") {
      const [current] = await tx.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1);
      if (!current || current.status !== "PENDING") return undefined;
      const bounds = [current.dayOffDate, current.workDate, input.date!, input.workDate!].sort();
      await assertPeriodRangeMutable(tx, bounds[0]!, bounds[bounds.length - 1]!);
      const [saved] = await tx.update(dayOffSwaps).set({ dayOffDate: input.date!, workDate: input.workDate!, reason: input.reason }).where(eq(dayOffSwaps.id, id)).returning();
      await recordAudit(tx, { action: "UPDATE_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: id, performedBy, before: current, after: saved!, reason: input.reason });
      return saved;
    }
    if (kind === "VACATION") {
      const [current] = await tx.select().from(vacations).where(eq(vacations.id, id)).limit(1);
      if (!current) return undefined;
      const bounds = [current.startDate, current.endDate, input.startDate!, input.endDate!].sort();
      await assertPeriodRangeMutable(tx, bounds[0]!, bounds[bounds.length - 1]!);
      if (await hasPeriodConflict(tx, input.employeeId, input.startDate!, input.endDate!, { kind: "VACATION", id })) throw new AvailabilityConflictError();
      const [saved] = await tx.update(vacations).set({ startDate: input.startDate!, endDate: input.endDate!, reason: input.reason }).where(eq(vacations.id, id)).returning();
      await recordAudit(tx, { action: "UPDATE_VACATION", entity: "Vacation", entityId: id, performedBy, before: current, after: saved!, reason: input.reason });
      return saved;
    }
    const [current] = await tx.select().from(leavePeriods).where(eq(leavePeriods.id, id)).limit(1);
    if (!current) return undefined;
    const bounds = [current.startDate, current.endDate, input.startDate!, input.endDate!].sort();
    await assertPeriodRangeMutable(tx, bounds[0]!, bounds[bounds.length - 1]!);
    if (await hasPeriodConflict(tx, input.employeeId, input.startDate!, input.endDate!, { kind: "LEAVE", id })) throw new AvailabilityConflictError();
    const [saved] = await tx.update(leavePeriods).set({ startDate: input.startDate!, endDate: input.endDate!, reason: input.reason, type: input.leaveType! }).where(eq(leavePeriods.id, id)).returning();
    await recordAudit(tx, { action: "UPDATE_LEAVE_PERIOD", entity: "LeavePeriod", entityId: id, performedBy, before: current, after: saved!, reason: input.reason });
    return saved;
  });
}

export async function deleteAvailability(kind: AvailabilityKind, id: string, performedBy: string) {
  return db.transaction(async (tx) => {
    if (kind === "DAY_OFF") {
      const [current] = await tx.select().from(daysOff).where(eq(daysOff.id, id)).limit(1);
      if (!current) return undefined;
      await assertPeriodRangeMutable(tx, current.date, current.date);
      await tx.delete(daysOff).where(eq(daysOff.id, id));
      await recordAudit(tx, { action: "DELETE_DAY_OFF", entity: "DayOff", entityId: id, performedBy, before: current, reason: "Exclusão administrativa" });
      return current;
    }
    if (kind === "SWAP") {
      const [current] = await tx.select().from(dayOffSwaps).where(eq(dayOffSwaps.id, id)).limit(1);
      if (!current) return undefined;
      const bounds = [current.dayOffDate, current.workDate].sort();
      await assertPeriodRangeMutable(tx, bounds[0]!, bounds[1]!);
      await tx.delete(dayOffSwaps).where(eq(dayOffSwaps.id, id));
      await recordAudit(tx, { action: "DELETE_DAY_OFF_SWAP", entity: "DayOffSwap", entityId: id, performedBy, before: current, reason: "Exclusão administrativa" });
      return current;
    }
    if (kind === "VACATION") {
      const [current] = await tx.select().from(vacations).where(eq(vacations.id, id)).limit(1);
      if (!current) return undefined;
      await assertPeriodRangeMutable(tx, current.startDate, current.endDate);
      await tx.delete(vacations).where(eq(vacations.id, id));
      await recordAudit(tx, { action: "DELETE_VACATION", entity: "Vacation", entityId: id, performedBy, before: current, reason: "Exclusão administrativa" });
      return current;
    }
    const [current] = await tx.select().from(leavePeriods).where(eq(leavePeriods.id, id)).limit(1);
    if (!current) return undefined;
    await assertPeriodRangeMutable(tx, current.startDate, current.endDate);
    await tx.delete(leavePeriods).where(eq(leavePeriods.id, id));
    await recordAudit(tx, { action: "DELETE_LEAVE_PERIOD", entity: "LeavePeriod", entityId: id, performedBy, before: current, reason: "Exclusão administrativa" });
    return current;
  });
}

export async function getEmployeeAvailability(employeeId: string) {
  const [off, swaps, vacationRows, leaves] = await Promise.all([
    db.select().from(daysOff).where(eq(daysOff.employeeId, employeeId)).orderBy(desc(daysOff.date)),
    db.select().from(dayOffSwaps).where(eq(dayOffSwaps.employeeId, employeeId)).orderBy(desc(dayOffSwaps.createdAt)),
    db.select().from(vacations).where(eq(vacations.employeeId, employeeId)).orderBy(desc(vacations.startDate)),
    db.select().from(leavePeriods).where(eq(leavePeriods.employeeId, employeeId)).orderBy(desc(leavePeriods.startDate)),
  ]);
  return { daysOff: off, swaps, vacations: vacationRows, leaves };
}
