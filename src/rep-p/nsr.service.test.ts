import { describe, expect, it } from "vitest";
import { exerciseConcurrentNsr } from "./nsr.service";
import { formatRepPNsr } from "./nsr-core";

describe("REP-P NSR concurrency", () => { it("preserva cem valores únicos e sequenciais sob concorrência", async () => { let current = 0; const values = await exerciseConcurrentNsr(async () => { current++; return formatRepPNsr(BigInt(current)); }, 100); expect(new Set(values).size).toBe(100); expect(values).toEqual(Array.from({ length: 100 }, (_, index) => String(index + 1).padStart(9, "0"))); }); });
