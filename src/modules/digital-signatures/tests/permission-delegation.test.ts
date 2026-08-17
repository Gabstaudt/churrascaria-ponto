import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
vi.mock("@/auth/session", () => ({ requireAdmin }));

const { requireSignaturePermission } = await import("../services/signature-permission.service");
const { requireAfdPermission } = await import("@/modules/afd/services/afd-permission.service");
const { requireAejPermission } = await import("@/modules/official-documents/services/aej-permission.service");

describe("acesso às operações de assinatura exige administrador", () => {
  beforeEach(() => { requireAdmin.mockReset(); });

  it("SIGNATURE_RETRY e demais permissões de assinatura delegam para requireAdmin", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    await expect(requireSignaturePermission("SIGNATURE_RETRY")).resolves.toMatchObject({ user: { role: "ADMIN" } });
    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("rejeita quando requireAdmin nega o acesso (funcionário, credencial de terminal ou visitante)", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(requireSignaturePermission("CERTIFICATE_CONFIGURE")).rejects.toThrow("NEXT_REDIRECT");
    await expect(requireAfdPermission("AFD_DOWNLOAD")).rejects.toThrow();
    await expect(requireAejPermission("AEJ_DOWNLOAD")).rejects.toThrow();
  });
});
