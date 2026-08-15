import { describe, expect, it } from "vitest";
import { timeEntrySourceValues } from "@/db/schema/enums";
describe("time entry origins", () => { it("mantém REP-C e adiciona REP-P na mesma estrutura", () => { expect(timeEntrySourceValues).toContain("REP_C"); expect(timeEntrySourceValues).toContain("REP_P"); }); });
