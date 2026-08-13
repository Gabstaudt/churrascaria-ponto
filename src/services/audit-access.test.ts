import { describe, expect, it } from "vitest";
import { canViewAudit } from "./audit-access";

describe("canViewAudit", () => {
  it("permite apenas administradores", () => {
    expect(canViewAudit("ADMIN")).toBe(true);
    expect(canViewAudit("EMPLOYEE")).toBe(false);
    expect(canViewAudit(undefined)).toBe(false);
  });
});
