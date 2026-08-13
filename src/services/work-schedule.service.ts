import "server-only";

import { and, asc, desc, eq, gte, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { employees, scheduleDays, workSchedules } from "@/db/schema";
import type { WorkScheduleCreateInput } from "@/validations/work-schedule";
import { recordAudit } from "./audit.service";
import { assertPeriodRangeMutable } from "./period-lock.service";

export class ScheduleOverlapError extends Error {
  constructor() { super("Já existe uma jornada vigente nesse período para o funcionário."); this.name = "ScheduleOverlapError"; }
}

export async function createWorkSchedule(input: WorkScheduleCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.validFrom, input.validTo ?? "9999-12-31");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.employeeId}))`);
    const [employee] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
    if (!employee) return undefined;
    const overlap = await tx.select({ id: workSchedules.id }).from(workSchedules).where(and(
      eq(workSchedules.employeeId, input.employeeId),
      or(isNull(workSchedules.validTo), gte(workSchedules.validTo, input.validFrom)),
      input.validTo ? lte(workSchedules.validFrom, input.validTo) : sql`true`,
    )).limit(1);
    if (overlap.length) throw new ScheduleOverlapError();
    const [schedule] = await tx.insert(workSchedules).values({ employeeId: input.employeeId, name: input.name, validFrom: input.validFrom, validTo: input.validTo }).returning();
    if (!schedule) throw new Error("Não foi possível criar a jornada.");
    await tx.insert(scheduleDays).values(input.days.map((day) => ({
      workScheduleId: schedule.id, dayOfWeek: day.dayOfWeek, isWorkDay: day.isWorkDay,
      startTime: day.isWorkDay ? day.startTime : null, endTime: day.isWorkDay ? day.endTime : null,
      breakStartTime: day.isWorkDay ? day.breakStartTime : null, breakEndTime: day.isWorkDay ? day.breakEndTime : null,
      toleranceMinutes: day.isWorkDay ? day.toleranceMinutes : 0,
    })));
    await recordAudit(tx, { action: "CREATE_WORK_SCHEDULE", entity: "WorkSchedule", entityId: schedule.id, performedBy, after: { employeeId: schedule.employeeId, name: schedule.name, validFrom: schedule.validFrom, validTo: schedule.validTo, days: input.days } });
    return schedule;
  });
}

export async function updateWorkSchedule(id: string, input: WorkScheduleCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.validFrom, input.validTo ?? "9999-12-31");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.employeeId}))`);
    const [current] = await tx.select().from(workSchedules).where(eq(workSchedules.id, id)).limit(1);
    if (!current) return undefined;
    const currentDays = await tx.select().from(scheduleDays).where(eq(scheduleDays.workScheduleId, id));
    const overlap = await tx.select({ id: workSchedules.id }).from(workSchedules).where(and(
      ne(workSchedules.id, id),
      eq(workSchedules.employeeId, input.employeeId),
      or(isNull(workSchedules.validTo), gte(workSchedules.validTo, input.validFrom)),
      input.validTo ? lte(workSchedules.validFrom, input.validTo) : sql`true`,
    )).limit(1);
    if (overlap.length) throw new ScheduleOverlapError();
    const [updated] = await tx.update(workSchedules).set({ employeeId: input.employeeId, name: input.name, validFrom: input.validFrom, validTo: input.validTo ?? null }).where(eq(workSchedules.id, id)).returning();
    await tx.delete(scheduleDays).where(eq(scheduleDays.workScheduleId, id));
    await tx.insert(scheduleDays).values(input.days.map((day) => ({
      workScheduleId: id, dayOfWeek: day.dayOfWeek, isWorkDay: day.isWorkDay,
      startTime: day.isWorkDay ? day.startTime : null, endTime: day.isWorkDay ? day.endTime : null,
      breakStartTime: day.isWorkDay ? day.breakStartTime : null, breakEndTime: day.isWorkDay ? day.breakEndTime : null,
      toleranceMinutes: day.isWorkDay ? day.toleranceMinutes : 0,
    })));
    await recordAudit(tx, { action: "UPDATE_WORK_SCHEDULE", entity: "WorkSchedule", entityId: id, performedBy, before: { ...current, days: currentDays }, after: { ...updated, days: input.days } });
    return updated;
  });
}

export async function listWorkSchedules() {
  return db.select({ id: workSchedules.id, name: workSchedules.name, validFrom: workSchedules.validFrom, validTo: workSchedules.validTo, employeeId: employees.id, employeeName: employees.fullName, position: employees.position }).from(workSchedules).innerJoin(employees, eq(employees.id, workSchedules.employeeId)).orderBy(asc(employees.fullName), desc(workSchedules.validFrom));
}

export async function listEligibleEmployees() {
  return db.select({ id: employees.id, fullName: employees.fullName, registrationNumber: employees.registrationNumber }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName));
}

export async function listWorkSchedulesByEmployee(employeeId: string) {
  return db.select({ id: workSchedules.id, name: workSchedules.name, validFrom: workSchedules.validFrom, validTo: workSchedules.validTo })
    .from(workSchedules).where(eq(workSchedules.employeeId, employeeId)).orderBy(desc(workSchedules.validFrom));
}

export async function getWorkScheduleById(id: string) {
  const [schedule] = await db.select({ id: workSchedules.id, name: workSchedules.name, validFrom: workSchedules.validFrom, validTo: workSchedules.validTo, employeeId: employees.id, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, position: employees.position }).from(workSchedules).innerJoin(employees, eq(employees.id, workSchedules.employeeId)).where(eq(workSchedules.id, id)).limit(1);
  if (!schedule) return undefined;
  const days = await db.select().from(scheduleDays).where(eq(scheduleDays.workScheduleId, id)).orderBy(asc(scheduleDays.dayOfWeek));
  return { ...schedule, days };
}
