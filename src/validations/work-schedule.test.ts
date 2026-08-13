import { describe, expect, it } from "vitest";
import { workScheduleCreateSchema } from "./work-schedule";

const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isWorkDay: dayOfWeek > 0 && dayOfWeek < 6, startTime: "11:00", endTime: "16:00", breakStartTime: "13:00", breakEndTime: "14:00", toleranceMinutes: 10 }));

describe("workScheduleCreateSchema", () => {
  it("aceita jornada semanal válida", () => expect(workScheduleCreateSchema.safeParse({ employeeId: "550e8400-e29b-41d4-a716-446655440000", name: "Jornada padrão", validFrom: "2026-08-01", days }).success).toBe(true));
  it("rejeita vigência invertida", () => expect(workScheduleCreateSchema.safeParse({ employeeId: "550e8400-e29b-41d4-a716-446655440000", name: "Jornada padrão", validFrom: "2026-08-10", validTo: "2026-08-01", days }).success).toBe(false));
  it("rejeita saída anterior à entrada", () => expect(workScheduleCreateSchema.safeParse({ employeeId: "550e8400-e29b-41d4-a716-446655440000", name: "Jornada padrão", validFrom: "2026-08-01", days: days.map((day, index) => index === 1 ? { ...day, endTime: "10:00" } : day) }).success).toBe(false));
});
