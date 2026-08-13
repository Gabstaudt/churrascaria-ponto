import { describe, expect, it } from "vitest";
import { calculateAttendance } from "./attendance-calculation";

const base = { date: "2026-08-13", situation: "WORK" as const, scheduleSource: "SCHEDULE", scheduleName: "Comercial", startTime: "08:00:00", endTime: "17:00:00", breakStartTime: "12:00:00", breakEndTime: "13:00:00", toleranceMinutes: 5, adjustments: [] };
const at = (hour: string) => new Date(`2026-08-13T${hour}:00-03:00`);

describe("calculateAttendance", () => {
  it("calcula jornada completa com intervalo em minutos inteiros", () => {
    const result = calculateAttendance({ ...base, entries: [{ id: "1", occurredAt: at("08:00") }, { id: "2", occurredAt: at("12:00") }, { id: "3", occurredAt: at("13:00") }, { id: "4", occurredAt: at("17:00") }] });
    expect(result).toMatchObject({ plannedMinutes: 480, scheduledBreakMinutes: 60, workedMinutes: 480, delayMinutes: 0, earlyDepartureMinutes: 0, overtimeMinutes: 0, deficitMinutes: 0, balanceMinutes: 0, status: "COMPLETE" });
  });
  it("aplica tolerância e mantém justificativa explicável", () => {
    const result = calculateAttendance({ ...base, entries: [{ id: "1", occurredAt: at("08:12") }, { id: "2", occurredAt: at("17:00") }], adjustments: [{ id: "a", type: "JUSTIFY_LATE", adjustedAt: null, originalTimeEntryId: null, reason: "Ocorrência" }] });
    expect(result.delayMinutes).toBe(7); expect(result.lateJustified).toBe(true);
  });
  it("não produz saldo para par incompleto", () => {
    const result = calculateAttendance({ ...base, entries: [{ id: "1", occurredAt: at("08:00") }, { id: "2", occurredAt: at("12:00") }, { id: "3", occurredAt: at("13:00") }] });
    expect(result.status).toBe("INCOMPLETE"); expect(result.balanceMinutes).toBeNull(); expect(result.workedMinutes).toBe(240);
  });
  it("calcula jornada que atravessa a meia-noite", () => {
    const result = calculateAttendance({ ...base, endTime: "04:00:00", breakStartTime: "00:00:00", breakEndTime: "01:00:00", entries: [{ id: "1", occurredAt: at("20:00") }, { id: "2", occurredAt: new Date("2026-08-14T04:00:00-03:00") }], startTime: "20:00:00" });
    expect(result.plannedMinutes).toBe(420); expect(result.workedMinutes).toBe(480); expect(result.overtimeMinutes).toBe(60);
  });
  it("recalcula sem estado oculto quando entradas mudam", () => {
    const first = calculateAttendance({ ...base, entries: [{ id: "1", occurredAt: at("08:00") }] });
    const second = calculateAttendance({ ...base, entries: [{ id: "1", occurredAt: at("08:00") }, { id: "2", occurredAt: at("17:00") }] });
    expect(first.balanceMinutes).toBeNull(); expect(second.balanceMinutes).toBe(60); expect(second.version).toBe(first.version);
  });
});
