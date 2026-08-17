import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
vi.mock("@/auth/session", () => ({ requireAdmin }));

const { requireBiometricPermission } = await import("../services/biometric-permission.service");

describe("acesso aos dados biométricos exige administrador", () => {
  beforeEach(() => { requireAdmin.mockReset(); });

  it("BIOMETRIC_VIEW_STATUS e demais permissões biométricas delegam para requireAdmin", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    await expect(requireBiometricPermission("BIOMETRIC_VIEW_STATUS")).resolves.toMatchObject({ user: { role: "ADMIN" } });
    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("gerente ou funcionário sem privilégio de administrador não acessa nenhuma operação biométrica", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(requireBiometricPermission("BIOMETRIC_ENROLL")).rejects.toThrow();
    await expect(requireBiometricPermission("BIOMETRIC_REVOKE")).rejects.toThrow();
    await expect(requireBiometricPermission("PRIVACY_ADMIN")).rejects.toThrow();
  });
});
