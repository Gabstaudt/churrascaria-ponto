import { describe, expect, it } from "vitest";
import { signatureRetryDelayMs } from "./signature-retry-policy";

describe("política de retry de assinatura", () => {
  it("aumenta o intervalo a cada nova tentativa até um teto", () => {
    expect(signatureRetryDelayMs(0)).toBe(60_000);
    expect(signatureRetryDelayMs(1)).toBe(300_000);
    expect(signatureRetryDelayMs(2)).toBe(900_000);
    expect(signatureRetryDelayMs(3)).toBe(3_600_000);
    expect(signatureRetryDelayMs(4)).toBe(21_600_000);
  });
  it("não excede o maior intervalo mesmo com muitas tentativas", () => {
    expect(signatureRetryDelayMs(5)).toBe(21_600_000);
    expect(signatureRetryDelayMs(100)).toBe(21_600_000);
  });
});
