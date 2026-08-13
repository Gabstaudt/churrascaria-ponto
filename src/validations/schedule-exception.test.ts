import { describe, expect, it } from "vitest";
import { scheduleExceptionSchema } from "./schedule-exception";

const base = { employeeId: "550e8400-e29b-41d4-a716-446655440000", date: "2026-08-20", reason: "Ajuste autorizado pela gestão", toleranceMinutes: 10 };

describe("scheduleExceptionSchema", () => {
  it("aceita folga excepcional com motivo", () => expect(scheduleExceptionSchema.safeParse({ ...base, type: "OFF" }).success).toBe(true));
  it("aceita trabalho excepcional válido", () => expect(scheduleExceptionSchema.safeParse({ ...base, type: "WORK", startTime: "10:00", endTime: "18:00", breakStartTime: "13:00", breakEndTime: "14:00" }).success).toBe(true));
  it("rejeita trabalho sem horários", () => expect(scheduleExceptionSchema.safeParse({ ...base, type: "WORK" }).success).toBe(false));
  it("rejeita intervalo fora do horário", () => expect(scheduleExceptionSchema.safeParse({ ...base, type: "WORK", startTime: "10:00", endTime: "18:00", breakStartTime: "09:00", breakEndTime: "11:00" }).success).toBe(false));
});
