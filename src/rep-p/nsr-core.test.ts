import { describe, expect, it } from "vitest";
import { formatRepPNsr } from "./nsr-core";
describe("REP-P NSR", () => { it("formata sequência única do estabelecimento", () => { expect(formatRepPNsr(BigInt(1))).toBe("000000001"); expect(formatRepPNsr(BigInt(100))).toBe("000000100"); }); it("rejeita valor não positivo", () => expect(() => formatRepPNsr(BigInt(0))).toThrow()); });
