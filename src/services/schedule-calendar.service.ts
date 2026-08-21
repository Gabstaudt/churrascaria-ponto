import "server-only";

import { and, asc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { dayOffSwaps, daysOff, employees, leavePeriods, scheduleDays, scheduleExceptions, scheduledOvertimePeriods, vacations, workSchedules } from "@/db/schema";
import type { ScheduleExceptionInput } from "@/validations/schedule-exception";
import { resolveScheduleDay, type CalendarSituation } from "./schedule-resolution";
import { recordAudit } from "./audit.service";
import { assertPeriodRangeMutable } from "./period-lock.service";

export type { CalendarSituation } from "./schedule-resolution";

function datesBetween(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) { dates.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  return dates;
}

export async function getScheduleCalendar(input: { start: string; end: string; employeeId?: string; position?: string; situation?: CalendarSituation }) {
  const employeeConditions = [eq(employees.isActive, true)];
  if (input.employeeId) employeeConditions.push(eq(employees.id, input.employeeId));
  if (input.position) employeeConditions.push(eq(employees.position, input.position));
  const people = await db.select({ id: employees.id, fullName: employees.fullName, position: employees.position, registrationNumber: employees.registrationNumber }).from(employees).where(and(...employeeConditions)).orderBy(asc(employees.fullName));
  if (!people.length) return { rows: [], employees: [], positions: [] };
  const ids = people.map((person) => person.id);
  const schedulesRaw = await db.select().from(workSchedules).where(and(inArray(workSchedules.employeeId, ids), lte(workSchedules.validFrom, input.end), or(isNull(workSchedules.validTo), gte(workSchedules.validTo, input.start)))).orderBy(asc(workSchedules.validFrom));
  const daysRaw = schedulesRaw.length ? await db.select().from(scheduleDays).where(inArray(scheduleDays.workScheduleId, schedulesRaw.map((schedule) => schedule.id))) : [];
  const [exceptions, off, swaps, vacationRows, leaves, overtimePeriodsRaw] = await Promise.all([
    db.select().from(scheduleExceptions).where(and(inArray(scheduleExceptions.employeeId, ids), gte(scheduleExceptions.date, input.start), lte(scheduleExceptions.date, input.end))),
    db.select().from(daysOff).where(and(inArray(daysOff.employeeId, ids), gte(daysOff.date, input.start), lte(daysOff.date, input.end))),
    db.select().from(dayOffSwaps).where(and(inArray(dayOffSwaps.employeeId, ids), eq(dayOffSwaps.status, "APPROVED"), or(and(gte(dayOffSwaps.dayOffDate, input.start), lte(dayOffSwaps.dayOffDate, input.end)), and(gte(dayOffSwaps.workDate, input.start), lte(dayOffSwaps.workDate, input.end))))),
    db.select().from(vacations).where(and(inArray(vacations.employeeId, ids), lte(vacations.startDate, input.end), gte(vacations.endDate, input.start))),
    db.select().from(leavePeriods).where(and(inArray(leavePeriods.employeeId, ids), lte(leavePeriods.startDate, input.end), gte(leavePeriods.endDate, input.start))),
    db.select().from(scheduledOvertimePeriods).where(and(inArray(scheduledOvertimePeriods.employeeId, ids), gte(scheduledOvertimePeriods.date, input.start), lte(scheduledOvertimePeriods.date, input.end))).orderBy(asc(scheduledOvertimePeriods.sequence)),
  ]);
  const schedules = schedulesRaw.map((schedule) => ({ ...schedule, days: daysRaw.filter((day) => day.workScheduleId === schedule.id) }));
  const dates = datesBetween(input.start, input.end);
  const rows = people.flatMap((person) => dates.map((date) => ({ employee: person, date, ...resolveScheduleDay(date, schedules.filter((schedule) => schedule.employeeId === person.id), exceptions.find((exception) => exception.employeeId === person.id && exception.date === date), {
    dayOff: off.find((item) => item.employeeId === person.id && item.date === date),
    absence: vacationRows.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date) ? { id: vacationRows.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date)!.id, type: "VACATION", reason: vacationRows.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date)!.reason } : leaves.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date) ? { id: leaves.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date)!.id, type: "LEAVE", reason: leaves.find((item) => item.employeeId === person.id && item.startDate <= date && item.endDate >= date)!.reason } : undefined,
    swap: swaps.find((item) => item.employeeId === person.id && (item.dayOffDate === date || item.workDate === date)),
  }), overtimePeriods: overtimePeriodsRaw.filter((item) => item.employeeId === person.id && item.date === date).map((item) => ({ id: item.id, startTime: item.startTime, endTime: item.endTime, toleranceMinutes: item.toleranceMinutes, reason: item.reason })) }))).filter((row) => !input.situation || row.situation === input.situation);
  return { rows, employees: people, positions: [...new Set(people.map((person) => person.position))].sort((a, b) => a.localeCompare(b, "pt-BR")) };
}

export async function listScheduleCalendarFilters() {
  const people = await db.select({ id: employees.id, fullName: employees.fullName, position: employees.position, registrationNumber: employees.registrationNumber }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName));
  return { employees: people, positions: [...new Set(people.map((person) => person.position))].sort((a, b) => a.localeCompare(b, "pt-BR")) };
}

export async function saveScheduleException(input: ScheduleExceptionInput, performedBy: string) {
  return db.transaction(async (tx) => {
    await assertPeriodRangeMutable(tx, input.date);
    const [existing] = await tx.select().from(scheduleExceptions).where(and(eq(scheduleExceptions.employeeId, input.employeeId), eq(scheduleExceptions.date, input.date))).limit(1);
    const values = { employeeId: input.employeeId, date: input.date, type: input.type, startTime: input.type === "WORK" ? input.startTime : null, endTime: input.type === "WORK" ? input.endTime : null, breakStartTime: input.type === "WORK" ? input.breakStartTime : null, breakEndTime: input.type === "WORK" ? input.breakEndTime : null, toleranceMinutes: input.type === "WORK" ? input.toleranceMinutes : 0, reason: input.reason, createdBy: performedBy };
    const [saved] = existing
      ? await tx.update(scheduleExceptions).set(values).where(eq(scheduleExceptions.id, existing.id)).returning()
      : await tx.insert(scheduleExceptions).values(values).returning();
    if (!saved) throw new Error("Não foi possível salvar o ajuste.");
    await recordAudit(tx, { action: existing ? "UPDATE_SCHEDULE_EXCEPTION" : "CREATE_SCHEDULE_EXCEPTION", entity: "ScheduleException", entityId: saved.id, performedBy, before: existing ?? null, after: saved, reason: input.reason });
    return saved;
  });
}
