import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { openssl } from "../certificates/openssl-command";
import { A1CertificateKeyProvider } from "../certificates/a1-certificate-key.provider";

const ORIGINAL_ENV = { ...process.env };
const SECRET_PASSWORD = "segredo-nao-pode-vazar-9273";

describe("A1CertificateKeyProvider", () => {
  let directory = ""; let pfxPath = "";

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "uptime-a1-test-"));
    const key = join(directory, "key.pem"); const cert = join(directory, "cert.pem"); pfxPath = join(directory, "certificate.pfx");
    await openssl(["req", "-x509", "-newkey", "rsa:2048", "-keyout", key, "-out", cert, "-days", "2", "-nodes", "-subj", "/CN=UpTime Teste A1"]);
    await openssl(["pkcs12", "-export", "-in", cert, "-inkey", key, "-out", pfxPath, "-passout", `pass:${SECRET_PASSWORD}`]);
  });
  afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
  afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

  it("rejeita quando as variáveis de ambiente do certificado não estão configuradas", async () => {
    delete process.env.CERTIFICATE_PFX_PATH; delete process.env.CERTIFICATE_PFX_PASSWORD;
    await expect(new A1CertificateKeyProvider().publicInfo()).rejects.toThrow("PRIVATE_KEY_UNAVAILABLE");
  });

  it("rejeita com senha incorreta sem expor a senha no erro", async () => {
    process.env.CERTIFICATE_PFX_PATH = pfxPath; process.env.CERTIFICATE_PFX_PASSWORD = "senha-errada";
    await expect(new A1CertificateKeyProvider().publicInfo()).rejects.toMatchObject({ message: "PRIVATE_KEY_UNAVAILABLE" });
    try { await new A1CertificateKeyProvider().publicInfo(); } catch (error) { expect(String(error)).not.toContain(SECRET_PASSWORD); expect(String(error)).not.toContain("senha-errada"); }
  });

  it("carrega o certificado válido e nunca expõe a senha configurada", async () => {
    process.env.CERTIFICATE_PFX_PATH = pfxPath; process.env.CERTIFICATE_PFX_PASSWORD = SECRET_PASSWORD;
    const info = await new A1CertificateKeyProvider().publicInfo();
    expect(info.status).toBe("VALID");
    expect(JSON.stringify(info)).not.toContain(SECRET_PASSWORD);
  });

  it("rejeita certificado expirado antes de disponibilizar a chave para assinatura", async () => {
    const expiredKey = join(directory, "expired-key.pem"); const expiredCert = join(directory, "expired-cert.pem"); const expiredPfx = join(directory, "expired.pfx");
    await openssl(["req", "-x509", "-newkey", "rsa:2048", "-keyout", expiredKey, "-out", expiredCert, "-nodes", "-subj", "/CN=UpTime Teste Expirado", "-not_before", "20200101000000Z", "-not_after", "20200201000000Z"]);
    await openssl(["pkcs12", "-export", "-in", expiredCert, "-inkey", expiredKey, "-out", expiredPfx, "-passout", `pass:${SECRET_PASSWORD}`]);
    process.env.CERTIFICATE_PFX_PATH = expiredPfx; process.env.CERTIFICATE_PFX_PASSWORD = SECRET_PASSWORD;
    await expect(new A1CertificateKeyProvider().publicInfo()).rejects.toThrow("CERTIFICATE_EXPIRED");
  });

  it("rejeita certificado ainda não válido", async () => {
    const futureKey = join(directory, "future-key.pem"); const futureCert = join(directory, "future-cert.pem"); const futurePfx = join(directory, "future.pfx");
    const stamp = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString().replace(/[-:T]/g, "").replace(/\.\d{3}Z$/, "Z");
    await openssl(["req", "-x509", "-newkey", "rsa:2048", "-keyout", futureKey, "-out", futureCert, "-nodes", "-subj", "/CN=UpTime Teste Futuro", "-not_before", stamp(365 * 24 * 60 * 60 * 1000), "-not_after", stamp(2 * 365 * 24 * 60 * 60 * 1000)]);
    await openssl(["pkcs12", "-export", "-in", futureCert, "-inkey", futureKey, "-out", futurePfx, "-passout", `pass:${SECRET_PASSWORD}`]);
    process.env.CERTIFICATE_PFX_PATH = futurePfx; process.env.CERTIFICATE_PFX_PASSWORD = SECRET_PASSWORD;
    await expect(new A1CertificateKeyProvider().publicInfo()).rejects.toThrow("CERTIFICATE_NOT_YET_VALID");
  });
});
