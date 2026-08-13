import { describe, expect, it } from "vitest";
import { applyTimeBankPolicy, reconcileDailyBalance, sumTimeBankEntries, timeBankConcurrencyKey } from "./time-bank-core";

describe("time bank core", () => {
  it("aplica percentuais com resultado inteiro", () => { expect(applyTimeBankPolicy(61, 15000, 10000)).toBe(91); expect(applyTimeBankPolicy(-61, 10000, 5000)).toBe(-30); });
  it("gera somente a diferença durante recálculo", () => expect(reconcileDailyBalance(60, 35)).toBe(-25));
  it("compensa créditos e débitos e reproduz o acumulado", () => expect(sumTimeBankEntries([{ amountMinutes: 60 }, { amountMinutes: -25 }, { amountMinutes: 10 }])).toBe(45));
  it("não duplica saldo na reconciliação idempotente", () => expect(reconcileDailyBalance(35, 35)).toBe(0));
  it("serializa concorrência pela mesma chave de funcionário e data", () => {
    expect(timeBankConcurrencyKey("employee-1", "2026-08-13")).toBe(timeBankConcurrencyKey("employee-1", "2026-08-13"));
    expect(timeBankConcurrencyKey("employee-1", "2026-08-13")).not.toBe(timeBankConcurrencyKey("employee-1", "2026-08-14"));
  });
});
