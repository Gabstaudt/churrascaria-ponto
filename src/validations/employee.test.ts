import { describe, expect, it } from "vitest";

import { employeeCreateSchema, employeeListQuerySchema } from "./employee";

const validEmployee = {
  fullName: "Maria da Silva",
  cpf: "529.982.247-25",
  phone: "(91) 99999-1234",
  position: "Atendente",
  registrationNumber: "FUNC-001",
  admissionDate: "2026-08-07",
};

describe("employeeCreateSchema", () => {
  it("normaliza CPF e telefone e aplica os padrões", () => {
    const result = employeeCreateSchema.parse(validEmployee);

    expect(result).toMatchObject({
      cpf: "52998224725",
      phone: "91999991234",
      status: "ACTIVE",
      isActive: true,
    });
  });

  it("rejeita CPF inválido", () => {
    const result = employeeCreateSchema.safeParse({
      ...validEmployee,
      cpf: "111.111.111-11",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita datas inexistentes", () => {
    const result = employeeCreateSchema.safeParse({
      ...validEmployee,
      admissionDate: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita matrícula vazia e telefone sem DDD", () => {
    const result = employeeCreateSchema.safeParse({
      ...validEmployee,
      registrationNumber: " ",
      phone: "123456789",
    });

    expect(result.success).toBe(false);
  });
});

describe("employeeListQuerySchema", () => {
  it("normaliza filtros e paginação", () => {
    expect(employeeListQuerySchema.parse({ query: "  Maria  ", status: "ACTIVE", page: "2" })).toEqual({ query: "Maria", status: "ACTIVE", page: 2 });
  });

  it("usa padrões seguros para parâmetros inválidos", () => {
    expect(employeeListQuerySchema.parse({ query: "", status: "INVALID", page: "-1" })).toEqual({ query: "", status: undefined, page: 1 });
  });
});
