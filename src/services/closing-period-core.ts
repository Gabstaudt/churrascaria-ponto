export type ClosingStatus = "OPEN" | "IN_REVIEW" | "CLOSED";

export function canManageClosingPeriod(role: string | null | undefined) { return role === "ADMIN"; }
export function canTransitionClosingPeriod(from: ClosingStatus, to: ClosingStatus) {
  return (from === "OPEN" && to === "IN_REVIEW") || (from === "IN_REVIEW" && to === "CLOSED") || (from === "CLOSED" && to === "OPEN");
}
export function monthBounds(referenceMonth: string) {
  const startDate = `${referenceMonth}-01`; const date = new Date(`${startDate}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + 1); date.setUTCDate(0);
  return { startDate, endDate: date.toISOString().slice(0, 10) };
}
export function hasCriticalClosingBlockers(blockers: Array<{ severity: "CRITICAL" | "WARNING"; count: number }>) { return blockers.some((item) => item.severity === "CRITICAL" && item.count > 0); }
export function aggregateClosingSummaries(summaries: Array<{ lateMinutes: number; overtimeMinutes: number; absenceDays: number; timeBankMinutes: number }>) {
  return summaries.reduce((total, item) => ({ late: total.late + item.lateMinutes, overtime: total.overtime + item.overtimeMinutes, absences: total.absences + item.absenceDays, bank: total.bank + item.timeBankMinutes }), { late: 0, overtime: 0, absences: 0, bank: 0 });
}
