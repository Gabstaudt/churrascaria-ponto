import { describe, expect, it } from "vitest";
import { simulatedTimeEntriesSchema } from "./time-entry";

const employeeId = "550e8400-e29b-41d4-a716-446655440000";
describe("simulatedTimeEntriesSchema", () => {
  it("aceita até oito horários válidos", () => expect(simulatedTimeEntriesSchema.safeParse({ employeeId, date: "2026-08-13", times: ["08:00", "12:00", "13:00", "17:00"] }).success).toBe(true));
  it("rejeita horários duplicados", () => expect(simulatedTimeEntriesSchema.safeParse({ employeeId, date: "2026-08-13", times: ["08:00", "08:00"] }).success).toBe(false));
  it("rejeita lista vazia", () => expect(simulatedTimeEntriesSchema.safeParse({ employeeId, date: "2026-08-13", times: [] }).success).toBe(false));
  it("rejeita horário inválido", () => expect(simulatedTimeEntriesSchema.safeParse({ employeeId, date: "2026-08-13", times: ["25:00"] }).success).toBe(false));
});
