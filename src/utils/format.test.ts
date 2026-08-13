import { describe, expect, it } from "vitest";
import { formatCpf, formatDate } from "./format";

describe("formatCpf", () => {
  it("formata os onze dígitos para exibição", () => expect(formatCpf("52998224725")).toBe("529.982.247-25"));
});

describe("formatDate", () => {
  it("formata data ISO civil sem conversão de timezone", () => expect(formatDate("2026-08-13")).toBe("13/08/2026"));
});
