import "server-only";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { A1CertificateKeyProvider } from "../certificates/a1-certificate-key.provider";
import { openssl } from "../certificates/openssl-command";
import type { CertificateKeyProvider } from "../certificates/certificate-key-provider";
import type { CadesSignInput, CadesSignResult, DigitalSignatureProvider, PadesSignInput, PadesSignResult, SignatureVerificationResult } from "../types";
import { embedPadesSignature, extractPadesSignature, preparePadesByteRange } from "./pades-pdf";

export class OpenSslDigitalSignatureProvider implements DigitalSignatureProvider {
  readonly name = "OPENSSL_A1";
  constructor(private readonly keys: CertificateKeyProvider = new A1CertificateKeyProvider()) {}
  certificateInfo() { return this.keys.publicInfo(); }
  async signCades(input: CadesSignInput): Promise<CadesSignResult> { return this.keys.withMaterial(async (material) => this.withFiles(async (directory) => { const documentPath = join(directory, "document.bin"); const signaturePath = join(directory, "signature.p7s"); await writeFile(documentPath, input.document); await openssl(["cms", "-sign", "-binary", "-cades", "-md", "sha256", "-in", documentPath, "-signer", material.certificatePath, "-inkey", material.privateKeyPath, "-outform", "DER", "-out", signaturePath, "-nosmimecap"]); return { signature: new Uint8Array(await readFile(signaturePath)), certificate: material.info, provider: this.name }; })); }
  async verifyCades(document: Uint8Array, signature: Uint8Array): Promise<SignatureVerificationResult> { try { return await this.withFiles(async (directory) => { const documentPath = join(directory, "document.bin"); const signaturePath = join(directory, "signature.p7s"); const verifiedPath = join(directory, "verified.bin"); await Promise.all([writeFile(documentPath, document), writeFile(signaturePath, signature)]); await openssl(["cms", "-verify", "-binary", "-inform", "DER", "-in", signaturePath, "-content", documentPath, "-noverify", "-out", verifiedPath]); const verified = await readFile(verifiedPath); return Buffer.from(document).equals(verified) ? { status: "VALID" } : { status: "HASH_MISMATCH", reasonCode: "CONTENT_MISMATCH" }; }); } catch { return { status: "INVALID", reasonCode: "CADES_VERIFICATION_FAILED" }; } }
  async signPades(input: PadesSignInput): Promise<PadesSignResult> { const range = preparePadesByteRange(input.pdf); const cades = await this.signCades({ document: range.signedContent, documentId: input.documentId, documentType: "AFD" }); return { signedPdf: embedPadesSignature(range.prepared, cades.signature, range.contentsStart, range.contentsEnd), certificate: cades.certificate, provider: this.name }; }
  async verifyPades(pdf: Uint8Array): Promise<SignatureVerificationResult> { try { const extracted = extractPadesSignature(pdf); return this.verifyCades(extracted.signedContent, extracted.signature); } catch { return { status: "SIGNATURE_MALFORMED", reasonCode: "PADES_VERIFICATION_FAILED" }; } }
  private async withFiles<T>(callback: (directory: string) => Promise<T>) { const directory = await mkdtemp(join(tmpdir(), "uptime-crypto-")); try { return await callback(directory); } finally { await rm(directory, { recursive: true, force: true }); } }
}
