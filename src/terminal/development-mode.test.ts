import { describe, expect, it } from "vitest";
import { developmentSimulationEnabled } from "./development-mode";
describe("simulação de identificação", () => { it("é impossível em produção", () => { expect(developmentSimulationEnabled("production")).toBe(false); expect(developmentSimulationEnabled("development")).toBe(true); }); });
