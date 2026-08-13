import { describe, expect, it } from "vitest";
import { resolveScheduleDay, type CalendarSchedule } from "./schedule-resolution";

const schedule: CalendarSchedule = {
  id: "schedule", employeeId: "employee", name: "Jornada padrão", validFrom: "2026-08-01", validTo: null,
  days: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isWorkDay: dayOfWeek > 0 && dayOfWeek < 6, startTime: "08:00", endTime: "17:00", breakStartTime: "12:00", breakEndTime: "13:00", toleranceMinutes: 10 })),
};

describe("resolveScheduleDay", () => {
  it("resolve o horário da jornada vigente", () => expect(resolveScheduleDay("2026-08-03", [schedule])).toMatchObject({ situation: "WORK", source: "SCHEDULE", startTime: "08:00" }));
  it("resolve a folga semanal", () => expect(resolveScheduleDay("2026-08-02", [schedule])).toMatchObject({ situation: "OFF", source: "SCHEDULE" }));
  it("informa quando não existe jornada vigente", () => expect(resolveScheduleDay("2026-07-31", [schedule])).toMatchObject({ situation: "NO_SCHEDULE", source: "NONE" }));
  it("prioriza a exceção da data", () => expect(resolveScheduleDay("2026-08-03", [schedule], { id: "exception", employeeId: "employee", date: "2026-08-03", type: "OFF", startTime: null, endTime: null, breakStartTime: null, breakEndTime: null, toleranceMinutes: 0, reason: "Folga autorizada" })).toMatchObject({ situation: "OFF", source: "EXCEPTION", reason: "Folga autorizada" }));
  it("prioriza férias sobre ajustes da escala", () => expect(resolveScheduleDay("2026-08-03", [schedule], undefined, { absence: { id: "vacation", type: "VACATION", reason: "Férias programadas" } })).toMatchObject({ situation: "VACATION", source: "ABSENCE" }));
  it("aplica folga pontual autorizada", () => expect(resolveScheduleDay("2026-08-03", [schedule], undefined, { dayOff: { id: "off", reason: "Folga autorizada" } })).toMatchObject({ situation: "OFF", source: "DAY_OFF" }));
  it("aplica os dois lados de uma troca aprovada", () => {
    const swap = { id: "swap", dayOffDate: "2026-08-03", workDate: "2026-08-08", reason: "Troca aprovada" };
    expect(resolveScheduleDay("2026-08-03", [schedule], undefined, { swap })).toMatchObject({ situation: "OFF", source: "SWAP" });
    expect(resolveScheduleDay("2026-08-08", [schedule], undefined, { swap })).toMatchObject({ situation: "WORK", source: "SWAP", startTime: "08:00" });
  });
});
