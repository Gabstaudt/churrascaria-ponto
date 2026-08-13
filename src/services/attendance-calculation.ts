import type { AdjustmentLike } from "./time-adjustment-core";

export const ATTENDANCE_CALCULATION_VERSION = "attendance-v1";

export type EffectiveEntry = { id: string; occurredAt: Date; origin?: "ORIGINAL" | "ADJUSTMENT"; adjustmentId?: string | null; reason?: string | null };
export type AttendanceCalculationInput = {
  date: string;
  situation: "WORK" | "OFF" | "VACATION" | "LEAVE" | "NO_SCHEDULE";
  scheduleSource: string;
  scheduleName: string | null;
  startTime: string | null;
  endTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  toleranceMinutes: number;
  entries: EffectiveEntry[];
  adjustments: AdjustmentLike[];
};

function plannedMoment(date: string, time: string, nextDay = false) {
  const moment = new Date(`${date}T${time.slice(0, 8)}-03:00`);
  if (nextDay) moment.setUTCDate(moment.getUTCDate() + 1);
  return moment;
}
function minuteDifference(later: Date, earlier: Date) { return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 60_000)); }
function isNextDay(time: string, startTime: string) { return time <= startTime; }

export function calculateAttendance(input: AttendanceCalculationInput) {
  const entries = [...input.entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const pairs = entries.reduce<Array<{ entry: EffectiveEntry; exit: EffectiveEntry | null; minutes: number | null }>>((result, entry, index) => {
    if (index % 2 === 0) result.push({ entry, exit: entries[index + 1] ?? null, minutes: entries[index + 1] ? minuteDifference(entries[index + 1]!.occurredAt, entry.occurredAt) : null });
    return result;
  }, []);
  const incomplete = entries.length % 2 !== 0;
  const workedMinutes = pairs.reduce((total, pair) => total + (pair.minutes ?? 0), 0);
  const workPlanned = input.situation === "WORK" && input.startTime && input.endTime;
  let plannedMinutes = 0; let scheduledBreakMinutes = 0; let plannedStart: Date | null = null; let plannedEnd: Date | null = null;
  if (workPlanned) {
    plannedStart = plannedMoment(input.date, input.startTime!);
    plannedEnd = plannedMoment(input.date, input.endTime!, isNextDay(input.endTime!, input.startTime!));
    if (input.breakStartTime && input.breakEndTime) {
      const breakStart = plannedMoment(input.date, input.breakStartTime, isNextDay(input.breakStartTime, input.startTime!));
      const breakEnd = plannedMoment(input.date, input.breakEndTime, input.breakEndTime <= input.breakStartTime || isNextDay(input.breakEndTime, input.startTime!));
      scheduledBreakMinutes = minuteDifference(breakEnd, breakStart);
    }
    plannedMinutes = Math.max(0, minuteDifference(plannedEnd, plannedStart) - scheduledBreakMinutes);
  }
  const firstEntry = entries[0]?.occurredAt; const lastExit = !incomplete && entries.length ? entries[entries.length - 1]!.occurredAt : undefined;
  const rawDelay = plannedStart && firstEntry ? minuteDifference(firstEntry, plannedStart) : null;
  const rawEarlyDeparture = plannedEnd && lastExit ? minuteDifference(plannedEnd, lastExit) : null;
  const delayMinutes = rawDelay === null ? null : Math.max(0, rawDelay - input.toleranceMinutes);
  const earlyDepartureMinutes = rawEarlyDeparture === null ? null : Math.max(0, rawEarlyDeparture - input.toleranceMinutes);
  const balanceMinutes = incomplete ? null : workedMinutes - plannedMinutes;
  const overtimeMinutes = balanceMinutes === null ? null : Math.max(0, balanceMinutes);
  const deficitMinutes = balanceMinutes === null ? null : Math.max(0, -balanceMinutes);
  const lateJustified = input.adjustments.some((item) => item.type === "JUSTIFY_LATE");
  const earlyDepartureJustified = input.adjustments.some((item) => item.type === "JUSTIFY_EARLY_EXIT");
  return {
    version: ATTENDANCE_CALCULATION_VERSION,
    status: incomplete ? "INCOMPLETE" as const : entries.length ? "COMPLETE" as const : "NO_ENTRIES" as const,
    plannedMinutes, scheduledBreakMinutes, workedMinutes, delayMinutes, earlyDepartureMinutes,
    overtimeMinutes, deficitMinutes, balanceMinutes, lateJustified, earlyDepartureJustified, pairs,
    explanation: [
      { code: "SCHEDULE", label: "Previsão", detail: workPlanned ? `${plannedMinutes} min previstos, descontando ${scheduledBreakMinutes} min de intervalo.` : `Situação ${input.situation}: sem minutos previstos.`, source: input.scheduleSource },
      { code: "ENTRIES", label: "Marcações efetivas", detail: `${entries.length} marcação(ões), ${workedMinutes} min trabalhados em pares completos.`, source: entries.some((item) => item.origin === "ADJUSTMENT") ? "ORIGINALS_AND_ADJUSTMENTS" : "ORIGINALS" },
      { code: "TOLERANCE", label: "Tolerância", detail: `${input.toleranceMinutes} min aplicados separadamente ao atraso e à saída antecipada.`, source: input.scheduleSource },
      { code: "BALANCE", label: "Saldo diário", detail: incomplete ? "Indisponível enquanto houver par incompleto." : `${workedMinutes} - ${plannedMinutes} = ${balanceMinutes} min.`, source: ATTENDANCE_CALCULATION_VERSION },
    ],
  };
}
