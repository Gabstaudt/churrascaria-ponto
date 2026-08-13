import { describe, expect, it } from "vitest";
import { belemDate, pairTimeEntries, resolveDailyStatus } from "./daily-attendance-core";

const entry = (id: string, time: string) => ({ id, occurredAt: new Date(`2026-08-13T${time}:00-03:00`) });
describe("pairTimeEntries", () => {
  it("ordena e pareia sem alterar os originais", () => {
    const original = [entry("exit", "12:00"), entry("entry", "08:00")];
    expect(pairTimeEntries(original)[0]).toMatchObject({ entry: { id: "entry" }, exit: { id: "exit" } });
    expect(original[0]!.id).toBe("exit");
  });
  it("mantém saída nula quando a quantidade é ímpar", () => expect(pairTimeEntries([entry("entry", "08:00")])[0]!.exit).toBeNull());
});
describe("resolveDailyStatus", () => {
  it("identifica presença", () => expect(resolveDailyStatus({ date: "2026-08-13", situation: "WORK", startTime: "08:00", toleranceMinutes: 10, entries: [entry("1", "08:05"), entry("2", "12:00")], now: entry("now", "18:00").occurredAt })).toBe("PRESENT"));
  it("identifica atraso após a tolerância", () => expect(resolveDailyStatus({ date: "2026-08-13", situation: "WORK", startTime: "08:00", toleranceMinutes: 10, entries: [entry("1", "08:11"), entry("2", "12:00")], now: entry("now", "18:00").occurredAt })).toBe("LATE"));
  it("identifica marcação incompleta", () => expect(resolveDailyStatus({ date: "2026-08-13", situation: "WORK", startTime: "08:00", toleranceMinutes: 10, entries: [entry("1", "08:00")], now: entry("now", "18:00").occurredAt })).toBe("INCOMPLETE"));
  it("não declara falta definitiva sem tratamento", () => expect(resolveDailyStatus({ date: "2026-08-12", situation: "WORK", startTime: "08:00", toleranceMinutes: 10, entries: [], now: entry("now", "18:00").occurredAt })).toBe("POSSIBLE_ABSENCE"));
  it("mantém dia futuro como previsto", () => expect(resolveDailyStatus({ date: "2026-08-14", situation: "WORK", startTime: "08:00", toleranceMinutes: 10, entries: [], now: entry("now", "18:00").occurredAt })).toBe("EXPECTED"));
  it("resolve a virada do dia no fuso de Belém", () => expect(belemDate(new Date("2026-08-14T01:30:00Z"))).toBe("2026-08-13"));
});
