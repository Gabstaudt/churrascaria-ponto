import "server-only";

import { getScheduleCalendar } from "./schedule-calendar.service";
import { listTimeEntries } from "./time-entry.service";
import { pairTimeEntries, resolveDailyStatus, type DailyStatus } from "./daily-attendance-core";
import { applyTimeAdjustments, hasLateJustification } from "./time-adjustment-core";
import { listAdjustmentsForPeriod } from "./time-adjustment.service";
import { listAbsenceDecisionsForDate } from "./absence.service";

export async function getDailyAttendance(date: string, now = new Date()) {
  const [calendar, entries, adjustments, absenceDecisions] = await Promise.all([
    getScheduleCalendar({ start: date, end: date }),
    listTimeEntries({ start: new Date(`${date}T00:00:00-03:00`), end: new Date(`${date}T23:59:59.999-03:00`) }),
    listAdjustmentsForPeriod(date, date),
    listAbsenceDecisionsForDate(date),
  ]);
  const rows = calendar.rows.map((planned) => {
    const originalEntries = entries.filter((entry) => entry.employeeId === planned.employee.id).map((entry) => ({ id: entry.id, occurredAt: entry.occurredAt }));
    const employeeAdjustments = adjustments.filter((adjustment) => adjustment.employeeId === planned.employee.id);
    const effectiveEntries = applyTimeAdjustments(originalEntries, employeeAdjustments);
    const rawStatus = resolveDailyStatus({ date, situation: planned.situation, startTime: planned.startTime, toleranceMinutes: planned.toleranceMinutes, entries: effectiveEntries, now });
    const absenceDecision = absenceDecisions.find((item) => item.employeeId === planned.employee.id);
    const status = rawStatus === "POSSIBLE_ABSENCE" && absenceDecision ? (absenceDecision.decision === "UNJUSTIFIED" ? "ABSENCE_UNJUSTIFIED" as const : "ABSENCE_JUSTIFIED" as const) : rawStatus === "LATE" && hasLateJustification(employeeAdjustments) ? "LATE_JUSTIFIED" as const : rawStatus;
    return { ...planned, originalEntries: originalEntries.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()), entries: effectiveEntries, adjustments: employeeAdjustments, absenceDecision, pairs: pairTimeEntries(effectiveEntries), status };
  });
  const count = (statuses: DailyStatus[]) => rows.filter((row) => statuses.includes(row.status)).length;
  return { date, rows, summary: { active: rows.length, present: count(["PRESENT", "LATE", "LATE_JUSTIFIED", "INCOMPLETE"]), late: count(["LATE"]), possibleAbsence: count(["POSSIBLE_ABSENCE"]), off: count(["OFF", "VACATION", "LEAVE"]), pending: count(["INCOMPLETE", "POSSIBLE_ABSENCE"]), expected: count(["EXPECTED"]) } };
}
