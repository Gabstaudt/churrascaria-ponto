import { describe, expect, it } from "vitest";
import { absenceDecisionSchema } from "./absence";

const base = { employeeId: "550e8400-e29b-41d4-a716-446655440000", date: "2026-08-13", reason: "Decisão autorizada pela administração" };
describe("absenceDecisionSchema", () => {
  it("aceita falta não justificada", () => expect(absenceDecisionSchema.safeParse({ ...base, decision: "UNJUSTIFIED" }).success).toBe(true));
  it("aceita erro de marcação", () => expect(absenceDecisionSchema.safeParse({ ...base, decision: "TIME_ENTRY_ERROR" }).success).toBe(true));
  it("rejeita motivo curto", () => expect(absenceDecisionSchema.safeParse({ ...base, decision: "JUSTIFIED", reason: "não" }).success).toBe(false));
  it("rejeita decisão desconhecida", () => expect(absenceDecisionSchema.safeParse({ ...base, decision: "UNKNOWN" }).success).toBe(false));
});
