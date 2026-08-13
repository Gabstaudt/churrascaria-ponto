import { describe, expect, it } from "vitest";
import { aggregateClosingSummaries, canManageClosingPeriod, canTransitionClosingPeriod, hasCriticalClosingBlockers, monthBounds } from "./closing-period-core";

describe("closing period core", () => {
  it("autoriza somente administrador", () => { expect(canManageClosingPeriod("ADMIN")).toBe(true); expect(canManageClosingPeriod("MANAGER")).toBe(false); expect(canManageClosingPeriod("EMPLOYEE")).toBe(false); });
  it("permite somente o workflow definido", () => { expect(canTransitionClosingPeriod("OPEN", "IN_REVIEW")).toBe(true); expect(canTransitionClosingPeriod("IN_REVIEW", "CLOSED")).toBe(true); expect(canTransitionClosingPeriod("CLOSED", "OPEN")).toBe(true); expect(canTransitionClosingPeriod("OPEN", "CLOSED")).toBe(false); });
  it("calcula corretamente fevereiro bissexto", () => expect(monthBounds("2028-02")).toEqual({ startDate: "2028-02-01", endDate: "2028-02-29" }));
  it("bloqueia apenas pendência crítica positiva", () => expect(hasCriticalClosingBlockers([{ severity: "WARNING", count: 2 }, { severity: "CRITICAL", count: 1 }])).toBe(true));
  it("mantém consistência entre resumos individuais e totais", () => expect(aggregateClosingSummaries([{ lateMinutes: 10, overtimeMinutes: 30, absenceDays: 1, timeBankMinutes: 20 }, { lateMinutes: 5, overtimeMinutes: 0, absenceDays: 0, timeBankMinutes: -10 }])).toEqual({ late: 15, overtime: 30, absences: 1, bank: 10 }));
});
