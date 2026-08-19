function isoDate(year: number, month: number, day: number) {
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

export function nextAcquisitiveAnniversary(admissionDate: string, today: string): string {
  const [admissionYear, month, day] = admissionDate.split("-").map(Number) as [number, number, number];
  let year = Number(today.slice(0, 4));
  let candidate = isoDate(year, month, day);
  if (candidate < today) { year += 1; candidate = isoDate(year, month, day); }
  const admission = isoDate(admissionYear, month, day);
  while (candidate <= admission) { year += 1; candidate = isoDate(year, month, day); }
  return candidate;
}

export function isWithinAcquisitiveAlertWindow(acquisitiveDate: string, today: string, daysAhead: number): boolean {
  const target = Date.parse(`${acquisitiveDate}T00:00:00Z`);
  const base = Date.parse(`${today}T00:00:00Z`);
  const diffDays = Math.round((target - base) / 86_400_000);
  return diffDays >= 0 && diffDays <= daysAhead;
}
