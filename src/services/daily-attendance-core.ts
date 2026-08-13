import type { CalendarSituation } from "./schedule-resolution";

export type DailyStatus = "EXPECTED" | "PRESENT" | "LATE" | "INCOMPLETE" | "POSSIBLE_ABSENCE" | "OFF" | "VACATION" | "LEAVE" | "NO_SCHEDULE";
export type EntryLike = { id: string; occurredAt: Date };

export function belemDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Belem", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function officialDateTime(date: string, time: string) { return new Date(`${date}T${time}:00-03:00`); }

export function pairTimeEntries(entries: EntryLike[]) {
  const sorted = [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const pairs = [];
  for (let index = 0; index < sorted.length; index += 2) pairs.push({ entry: sorted[index]!, exit: sorted[index + 1] ?? null });
  return pairs;
}

export function resolveDailyStatus(input: { date: string; situation: CalendarSituation; startTime: string | null; toleranceMinutes: number; entries: EntryLike[]; now: Date }) {
  if (input.situation !== "WORK") return input.situation as Extract<DailyStatus, "OFF" | "VACATION" | "LEAVE" | "NO_SCHEDULE">;
  const pairs = pairTimeEntries(input.entries);
  if (input.entries.length) {
    if (input.entries.length % 2 !== 0) return "INCOMPLETE" as const;
    if (input.startTime) {
      const limit = officialDateTime(input.date, input.startTime).getTime() + input.toleranceMinutes * 60_000;
      if (pairs[0]!.entry.occurredAt.getTime() > limit) return "LATE" as const;
    }
    return "PRESENT" as const;
  }
  const today = belemDate(input.now);
  if (input.date > today) return "EXPECTED" as const;
  if (input.date < today) return "POSSIBLE_ABSENCE" as const;
  if (!input.startTime || input.now.getTime() <= officialDateTime(input.date, input.startTime).getTime() + input.toleranceMinutes * 60_000) return "EXPECTED" as const;
  return "POSSIBLE_ABSENCE" as const;
}
