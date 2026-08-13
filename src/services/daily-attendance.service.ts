import "server-only";

import { getScheduleCalendar } from "./schedule-calendar.service";
import { listTimeEntries } from "./time-entry.service";
import { pairTimeEntries, resolveDailyStatus, type DailyStatus } from "./daily-attendance-core";

export async function getDailyAttendance(date: string, now = new Date()) {
  const [calendar, entries] = await Promise.all([
    getScheduleCalendar({ start: date, end: date }),
    listTimeEntries({ start: new Date(`${date}T00:00:00-03:00`), end: new Date(`${date}T23:59:59.999-03:00`) }),
  ]);
  const rows = calendar.rows.map((planned) => {
    const employeeEntries = entries.filter((entry) => entry.employeeId === planned.employee.id).map((entry) => ({ id: entry.id, occurredAt: entry.occurredAt }));
    const status = resolveDailyStatus({ date, situation: planned.situation, startTime: planned.startTime, toleranceMinutes: planned.toleranceMinutes, entries: employeeEntries, now });
    return { ...planned, entries: employeeEntries.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()), pairs: pairTimeEntries(employeeEntries), status };
  });
  const count = (statuses: DailyStatus[]) => rows.filter((row) => statuses.includes(row.status)).length;
  return { date, rows, summary: { active: rows.length, present: count(["PRESENT", "LATE", "INCOMPLETE"]), late: count(["LATE"]), possibleAbsence: count(["POSSIBLE_ABSENCE"]), off: count(["OFF", "VACATION", "LEAVE"]), pending: count(["INCOMPLETE", "POSSIBLE_ABSENCE"]), expected: count(["EXPECTED"]) } };
}
