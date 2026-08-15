import { describe, expect, it } from "vitest";
import { retryDelayMs } from "./backoff";

describe("Ponto Sync backoff", () => {
  it("cresce exponencialmente e limita em cinco minutos", () => { expect(retryDelayMs(1, () => 0.5)).toBe(1_000); expect(retryDelayMs(4, () => 0.5)).toBe(8_000); expect(retryDelayMs(99, () => 0.5)).toBeLessThanOrEqual(300_000); });
});
