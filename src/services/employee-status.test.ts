import { describe, expect, it } from "vitest";
import { isEmployeeActiveForStatus, resolveEmployeeActivation } from "./employee-status";

describe("isEmployeeActiveForStatus", () => {
  it.each(["ACTIVE", "VACATION", "LEAVE"] as const)("mantém %s como vínculo ativo", (status) => {
    expect(isEmployeeActiveForStatus(status)).toBe(true);
  });

  it.each(["INACTIVE", "TERMINATED"] as const)("marca %s como vínculo inativo", (status) => {
    expect(isEmployeeActiveForStatus(status)).toBe(false);
  });
});

describe("resolveEmployeeActivation", () => {
  it("inativa sem excluir o registro", () => expect(resolveEmployeeActivation(false)).toEqual({ status: "INACTIVE", isActive: false }));
  it("reativa com status ativo", () => expect(resolveEmployeeActivation(true)).toEqual({ status: "ACTIVE", isActive: true }));
});
