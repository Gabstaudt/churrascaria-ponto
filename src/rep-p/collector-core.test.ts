import { describe, expect, it } from "vitest";
import { collectorCanRegister } from "./collector-core";
describe("REP-P collector authorization", () => { it("autoriza somente coletor ativo", () => { expect(collectorCanRegister("ACTIVE")).toBe(true); expect(collectorCanRegister("INACTIVE")).toBe(false); expect(collectorCanRegister("BLOCKED")).toBe(false); }); });
