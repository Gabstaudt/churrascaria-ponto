export function simulatedExternalId(employeeId: string, date: string, time: string) {
  return `sim:${employeeId}:${date}T${time}:00-03:00`;
}

export function localBelemDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}
