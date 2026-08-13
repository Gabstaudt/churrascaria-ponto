import "server-only";

import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, employees, scheduleDays, workSchedules } from "@/db/schema";
import type { WorkScheduleCreateInput } from "@/validations/work-schedule";

export class ScheduleOverlapError extends Error {
  constructor() { super("Já existe uma jornada vigente nesse período para o funcionário."); this.name = "ScheduleOverlapError"; }
}

export async function createWorkSchedule(input: WorkScheduleCreateInput, performedBy: string) {
  return db.transaction(async (tx) => {
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
    await tx.insert(auditLogs).values({ action: "CREATE_WORK_SCHEDULE", entity: "WorkSchedule", entityId: schedule.id, performedBy, after: { employeeId: schedule.employeeId, name: schedule.name, validFrom: schedule.validFrom, validTo: schedule.validTo, days: input.days } });
    return schedule;
  });
}

export async function listWorkSchedules() {
  return db.select({ id: workSchedules.id, name: workSchedules.name, validFrom: workSchedules.validFrom, validTo: workSchedules.validTo, employeeId: employees.id, employeeName: employees.fullName, position: employees.position }).from(workSchedules).innerJoin(employees, eq(employees.id, workSchedules.employeeId)).orderBy(asc(employees.fullName), desc(workSchedules.validFrom));
}

export async function listEligibleEmployees() {
  return db.select({ id: employees.id, fullName: employees.fullName, registrationNumber: employees.registrationNumber }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName));
}

export async function getWorkScheduleById(id: string) {
  const [schedule] = await db.select({ id: workSchedules.id, name: workSchedules.name, validFrom: workSchedules.validFrom, validTo: workSchedules.validTo, employeeId: employees.id, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, position: employees.position }).from(workSchedules).innerJoin(employees, eq(employees.id, workSchedules.employeeId)).where(eq(workSchedules.id, id)).limit(1);
  if (!schedule) return undefined;
  const days = await db.select().from(scheduleDays).where(eq(scheduleDays.workScheduleId, id)).orderBy(asc(scheduleDays.dayOfWeek));
  return { ...schedule, days };
}
