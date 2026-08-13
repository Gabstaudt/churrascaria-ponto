import { describe, expect, it } from "vitest";
import { applyTimeAdjustments, hasLateJustification } from "./time-adjustment-core";

const original = [{ id: "one", occurredAt: new Date("2026-08-13T11:00:00Z") }, { id: "two", occurredAt: new Date("2026-08-13T15:00:00Z") }];
describe("applyTimeAdjustments", () => {
  it("inclui ajuste sem alterar a lista original", () => {
    const result = applyTimeAdjustments(original, [{ id: "add", type: "ADD_ENTRY", adjustedAt: new Date("2026-08-13T19:00:00Z"), originalTimeEntryId: null, reason: "Saída incluída" }]);
    expect(result).toHaveLength(3); expect(original).toHaveLength(2); expect(result[2]).toMatchObject({ origin: "ADJUSTMENT" });
  });
  it("desconsidera logicamente sem apagar o original", () => {
    const result = applyTimeAdjustments(original, [{ id: "ignore", type: "IGNORE_ENTRY", adjustedAt: null, originalTimeEntryId: "two", reason: "Marcação indevida" }]);
    expect(result.map((item) => item.id)).toEqual(["one"]); expect(original.map((item) => item.id)).toEqual(["one", "two"]);
  });
  it("reconhece justificativa de atraso", () => expect(hasLateJustification([{ id: "late", type: "JUSTIFY_LATE", adjustedAt: null, originalTimeEntryId: null, reason: "Trânsito interrompido" }])).toBe(true));
});
