import { describe, expect, it } from "vitest";

import { isValidCpf, normalizeCpf } from "./cpf";

describe("normalizeCpf", () => {
  it("remove a máscara e mantém somente os dígitos", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita dígitos verificadores inválidos", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("rejeita sequências repetidas", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
});
