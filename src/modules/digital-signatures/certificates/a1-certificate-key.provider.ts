import "server-only";
import { mkdtemp, readFile, rm, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CertificatePublicInfo } from "../types";
import type { CertificateKeyProvider, CertificateMaterial } from "./certificate-key-provider";
import { publicCertificateInfo } from "./certificate-validator";
import { openssl } from "./openssl-command";

export class A1CertificateKeyProvider implements CertificateKeyProvider {
  private configuration() { const pfxPath = process.env.CERTIFICATE_PFX_PATH; const password = process.env.CERTIFICATE_PFX_PASSWORD; const alias = process.env.CERTIFICATE_ALIAS ?? "ICP-Brasil A1"; if (!pfxPath || !password) throw new Error("PRIVATE_KEY_UNAVAILABLE"); return { pfxPath, password, alias }; }
  async withMaterial<T>(callback: (material: CertificateMaterial) => Promise<T>): Promise<T> {
    const config = this.configuration(); const directory = await mkdtemp(join(tmpdir(), "uptime-signature-")); const certificatePath = join(directory, "certificate.pem"); const privateKeyPath = join(directory, "private-key.pem"); const childEnv = { UPTIME_CERTIFICATE_PASSWORD: config.password };
    try { await openssl(["pkcs12", "-in", config.pfxPath, "-clcerts", "-nokeys", "-out", certificatePath, "-passin", "env:UPTIME_CERTIFICATE_PASSWORD"], childEnv); await openssl(["pkcs12", "-in", config.pfxPath, "-nocerts", "-nodes", "-out", privateKeyPath, "-passin", "env:UPTIME_CERTIFICATE_PASSWORD"], childEnv); await chmod(privateKeyPath, 0o600); const info = publicCertificateInfo(await readFile(certificatePath, "utf8"), config.alias, "A1"); if (info.status !== "VALID") throw new Error(info.status === "EXPIRED" ? "CERTIFICATE_EXPIRED" : info.status === "NOT_YET_VALID" ? "CERTIFICATE_NOT_YET_VALID" : "CERTIFICATE_INVALID"); return await callback({ certificatePath, privateKeyPath, info }); }
    catch (error) { const code = error instanceof Error && ["CERTIFICATE_EXPIRED", "CERTIFICATE_NOT_YET_VALID", "CERTIFICATE_INVALID"].includes(error.message) ? error.message : "PRIVATE_KEY_UNAVAILABLE"; throw new Error(code); }
    finally { await rm(directory, { recursive: true, force: true }); }
  }
  async publicInfo(): Promise<CertificatePublicInfo> { return this.withMaterial(async ({ info }) => info); }
}
