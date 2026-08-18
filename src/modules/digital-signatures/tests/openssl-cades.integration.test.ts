import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publicCertificateInfo } from "../certificates/certificate-validator";
import { openssl } from "../certificates/openssl-command";
import type { CertificateKeyProvider } from "../certificates/certificate-key-provider";
import { OpenSslDigitalSignatureProvider } from "../providers/openssl-digital-signature.provider";
import { renderReceiptPdf } from "@/modules/point-receipts/pdf/point-receipt-pdf.service";

describe("assinatura CAdES destacada com OpenSSL", () => {
  let directory = ""; let provider: OpenSslDigitalSignatureProvider;
  beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), "uptime-cades-test-")); const key = join(directory, "key.pem"); const cert = join(directory, "cert.pem"); await openssl(["req", "-x509", "-newkey", "rsa:2048", "-keyout", key, "-out", cert, "-days", "2", "-nodes", "-subj", "/CN=UpTime Teste"]); const info = publicCertificateInfo(await readFile(cert, "utf8"), "Teste", "A1"); const keys: CertificateKeyProvider = { publicInfo: async () => info, withMaterial: async (callback) => callback({ certificatePath: cert, privateKeyPath: key, info }) }; provider = new OpenSslDigitalSignatureProvider(keys); });
  afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
  it("assina, verifica e rejeita documento adulterado", async () => { const document = new TextEncoder().encode("AFD conhecido\r\n"); const signed = await provider.signCades({ document, documentId: crypto.randomUUID(), documentType: "AFD" }); expect(signed.signature[0]).toBe(0x30); await expect(provider.verifyCades(document, signed.signature)).resolves.toMatchObject({ status: "VALID" }); await expect(provider.verifyCades(new TextEncoder().encode("AFD alterado\r\n"), signed.signature)).resolves.toMatchObject({ status: "INVALID" }); });
  it("incorpora PAdES verificável e detecta alteração posterior", async () => { const pdf = renderReceiptPdf({ title: "COMPROVANTE", sections: [{ label: "NSR", value: "1" }], verificationPath: "/verificar/1", footer: "UpTime" }); const signed = await provider.signPades({ pdf, documentId: crypto.randomUUID(), documentType: "POINT_RECEIPT" }); expect(Buffer.from(signed.signedPdf).toString("latin1")).toContain("/ETSI.CAdES.detached"); await expect(provider.verifyPades(signed.signedPdf)).resolves.toMatchObject({ status: "VALID" }); const altered = new Uint8Array(signed.signedPdf); altered[20] ^= 1; await expect(provider.verifyPades(altered)).resolves.not.toMatchObject({ status: "VALID" }); });
});
