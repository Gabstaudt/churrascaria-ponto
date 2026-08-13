export type CalendarSituation = "WORK" | "OFF" | "NO_SCHEDULE";
export type CalendarDay = { dayOfWeek: number; isWorkDay: boolean; startTime: string | null; endTime: string | null; breakStartTime: string | null; breakEndTime: string | null; toleranceMinutes: number };
export type CalendarSchedule = { id: string; employeeId: string; name: string; validFrom: string; validTo: string | null; days: CalendarDay[] };
export type CalendarException = { id: string; employeeId: string; date: string; type: "WORK" | "OFF"; startTime: string | null; endTime: string | null; breakStartTime: string | null; breakEndTime: string | null; toleranceMinutes: number; reason: string };

export function resolveScheduleDay(date: string, schedules: CalendarSchedule[], exception?: CalendarException) {
  if (exception) return { situation: exception.type as Exclude<CalendarSituation, "NO_SCHEDULE">, source: "EXCEPTION" as const, scheduleName: "Ajuste excepcional", startTime: exception.startTime, endTime: exception.endTime, breakStartTime: exception.breakStartTime, breakEndTime: exception.breakEndTime, toleranceMinutes: exception.toleranceMinutes, reason: exception.reason, exceptionId: exception.id };
  const schedule = schedules.find((item) => item.validFrom <= date && (!item.validTo || item.validTo >= date));
  if (!schedule) return { situation: "NO_SCHEDULE" as const, source: "NONE" as const, scheduleName: null, startTime: null, endTime: null, breakStartTime: null, breakEndTime: null, toleranceMinutes: 0, reason: null, exceptionId: null };
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const day = schedule.days.find((item) => item.dayOfWeek === weekday);
  if (!day?.isWorkDay) return { situation: "OFF" as const, source: "SCHEDULE" as const, scheduleName: schedule.name, startTime: null, endTime: null, breakStartTime: null, breakEndTime: null, toleranceMinutes: 0, reason: null, exceptionId: null };
  return { situation: "WORK" as const, source: "SCHEDULE" as const, scheduleName: schedule.name, startTime: day.startTime, endTime: day.endTime, breakStartTime: day.breakStartTime, breakEndTime: day.breakEndTime, toleranceMinutes: day.toleranceMinutes, reason: null, exceptionId: null };
}
