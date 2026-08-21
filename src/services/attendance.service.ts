import "server-only";

import { calculateAttendance } from "./attendance-calculation";
import { getScheduleCalendar } from "./schedule-calendar.service";
import { applyTimeAdjustments } from "./time-adjustment-core";
import { listTimeAdjustments } from "./time-adjustment.service";
import { listTimeEntries } from "./time-entry.service";

function endOfCalculationWindow(date: string, startTime: string | null, endTime: string | null, overtimePeriods: { endTime: string }[]) {
  if (!startTime || !endTime) return new Date(`${date}T23:59:59.999-03:00`);
  const lastEndTime = overtimePeriods.length ? overtimePeriods.reduce((latest, period) => (period.endTime > latest ? period.endTime : latest), endTime) : endTime;
  const endDate = lastEndTime <= startTime ? nextDate(date) : date;
  const value = new Date(`${endDate}T${lastEndTime.slice(0, 8)}-03:00`);
  value.setTime(value.getTime() + 6 * 60 * 60 * 1000);
  return value;
}
function nextDate(date: string) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10); }

export async function getDailyAttendanceCalculation(employeeId: string, date: string) {
  const calendar = await getScheduleCalendar({ start: date, end: date, employeeId });
  const planned = calendar.rows.find((row) => row.employee.id === employeeId);
  if (!planned) return undefined;
  const [originalEntries, adjustments] = await Promise.all([
    listTimeEntries({ employeeId, start: new Date(`${date}T00:00:00-03:00`), end: endOfCalculationWindow(date, planned.startTime, planned.endTime, planned.overtimePeriods) }),
    listTimeAdjustments({ employeeId, date }),
  ]);
  const effectiveEntries = applyTimeAdjustments(originalEntries.map((entry) => ({ id: entry.id, occurredAt: entry.occurredAt })), adjustments);
  const calculation = calculateAttendance({ date, situation: planned.situation, scheduleSource: planned.source, scheduleName: planned.scheduleName, startTime: planned.startTime, endTime: planned.endTime, breakStartTime: planned.breakStartTime, breakEndTime: planned.breakEndTime, toleranceMinutes: planned.toleranceMinutes, entries: effectiveEntries, adjustments, overtimePeriods: planned.overtimePeriods });
  return { employee: planned.employee, schedule: { situation: planned.situation, source: planned.source, name: planned.scheduleName, startTime: planned.startTime, endTime: planned.endTime, breakStartTime: planned.breakStartTime, breakEndTime: planned.breakEndTime, toleranceMinutes: planned.toleranceMinutes, overtimePeriods: planned.overtimePeriods }, originalEntries, effectiveEntries, adjustments, calculation };
}
