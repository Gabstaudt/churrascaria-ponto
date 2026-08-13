import { describe, expect, it } from "vitest";

import { EmployeeConflictError, mapEmployeeConflict } from "./employee-errors";

describe("mapEmployeeConflict", () => {
  it("converte conflito de CPF em erro de domínio", () => {
    const error = mapEmployeeConflict({ code: "23505", constraint_name: "employees_cpf_unique" });
    expect(error).toBeInstanceOf(EmployeeConflictError);
    expect(error?.field).toBe("cpf");
  });

  it("converte conflito de matrícula em erro de domínio", () => {
    const error = mapEmployeeConflict({ code: "23505", constraint_name: "employees_registration_number_unique" });
    expect(error?.field).toBe("registrationNumber");
  });

  it("não converte erros internos desconhecidos", () => {
    expect(mapEmployeeConflict({ code: "08006" })).toBeUndefined();
  });
});
