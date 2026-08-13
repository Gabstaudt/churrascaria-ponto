export function applyTimeBankPolicy(minutes: number, creditBasisPoints: number, debitBasisPoints: number) {
  const factor = minutes >= 0 ? creditBasisPoints : debitBasisPoints;
  const absolute = Math.abs(minutes);
  const adjusted = Math.trunc((absolute * factor) / 10_000);
  return minutes < 0 ? -adjusted : adjusted;
}

export function reconcileDailyBalance(previousCalculated: number | null, nextCalculated: number) {
  return nextCalculated - (previousCalculated ?? 0);
}

export function sumTimeBankEntries(entries: Array<{ amountMinutes: number }>) {
  return entries.reduce((total, entry) => total + entry.amountMinutes, 0);
}

export function timeBankConcurrencyKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}
