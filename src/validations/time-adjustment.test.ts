import { describe, expect, it } from "vitest";
import { timeAdjustmentSchema } from "./time-adjustment";

const base = { employeeId: "550e8400-e29b-41d4-a716-446655440000", date: "2026-08-13", reason: "Correção autorizada pela gestão" };
describe("timeAdjustmentSchema", () => {
  it("aceita inclusão com horário", () => expect(timeAdjustmentSchema.safeParse({ ...base, type: "ADD_ENTRY", time: "17:00" }).success).toBe(true));
  it("exige horário para saída esquecida", () => expect(timeAdjustmentSchema.safeParse({ ...base, type: "FORGOTTEN_EXIT" }).success).toBe(false));
  it("exige marcação original para desconsideração", () => expect(timeAdjustmentSchema.safeParse({ ...base, type: "IGNORE_ENTRY" }).success).toBe(false));
  it("aceita justificativa sem alterar horário", () => expect(timeAdjustmentSchema.safeParse({ ...base, type: "JUSTIFY_LATE" }).success).toBe(true));
});
