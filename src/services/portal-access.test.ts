import { describe, expect, it } from "vitest";
import { canAccessEmployee, canReviewPortalRequest, portalHome } from "./portal-access";
describe("portal access", () => {
  it("bloqueia acesso horizontal do funcionário", () => { expect(canAccessEmployee("EMPLOYEE", "own", [], "own")).toBe(true); expect(canAccessEmployee("EMPLOYEE", "own", [], "other")).toBe(false); });
  it("limita gerente ao escopo explícito", () => { expect(canAccessEmployee("MANAGER", null, ["team"], "team")).toBe(true); expect(canAccessEmployee("MANAGER", null, ["team"], "outside")).toBe(false); });
  it("não concede administração ao gerente", () => { expect(canReviewPortalRequest("MANAGER")).toBe(true); expect(portalHome("MANAGER")).toBe("/gestao"); expect(portalHome("ADMIN")).toBe("/admin"); });
});
