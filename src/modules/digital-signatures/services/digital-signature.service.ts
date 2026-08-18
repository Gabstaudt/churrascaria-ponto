import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { certificateMetadata, signatureOperations } from "@/db/schema";
import { getPrivateObjectBytes, putPrivateObject } from "@/services/object-storage.service";
import { OpenSslDigitalSignatureProvider } from "../providers/openssl-digital-signature.provider";
import { assertSignatureMapping, SIGNATURE_IMPLEMENTATION_VERSION, type DigitalSignatureProvider, type DocumentType } from "../types";
import { signatureRetryDelayMs } from "./signature-retry-policy";

const SOFTWARE_VERSION = process.env.NEXT_PUBLIC_TERMINAL_VERSION ?? "0.1.0";
const STALE_AFTER_MS = 5 * 60_000;
function hash(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function retryAt(count: number) { return new Date(Date.now() + signatureRetryDelayMs(count)); }

export class DigitalSignatureService {
  constructor(private readonly provider: DigitalSignatureProvider = new OpenSslDigitalSignatureProvider()) {}

  async signCades(documentType: "AFD" | "AEJ", documentId: string, document: Uint8Array, signatureFileKey: string) {
    assertSignatureMapping(documentType, "CADES"); const inputHash = hash(document); const certificate = await this.provider.certificateInfo();
    const [metadata] = await db.select({ status: certificateMetadata.status }).from(certificateMetadata).where(eq(certificateMetadata.serialNumber, certificate.serialNumber)).limit(1);
    if (metadata?.status === "DISABLED" || metadata?.status === "REVOKED") throw new Error("CERTIFICATE_DISABLED");
    const [reserved] = await db.insert(signatureOperations).values({ documentType, documentId, signatureType: "CADES", status: "PENDING", certificateSerialNumber: certificate.serialNumber, certificateSubject: certificate.subject, inputHash, provider: "OPENSSL_A1", implementationVersion: SIGNATURE_IMPLEMENTATION_VERSION, softwareVersion: SOFTWARE_VERSION }).onConflictDoNothing().returning();
    const operation = reserved ?? (await db.select().from(signatureOperations).where(and(eq(signatureOperations.documentType, documentType), eq(signatureOperations.documentId, documentId), eq(signatureOperations.signatureType, "CADES"), eq(signatureOperations.inputHash, inputHash), eq(signatureOperations.certificateSerialNumber, certificate.serialNumber))).limit(1))[0];
    if (!operation) throw new Error("SIGNATURE_OPERATION_NOT_RESERVED");
    if (operation.status === "SIGNED" && operation.signatureFileKey && operation.outputHash) { const signature = await getPrivateObjectBytes(operation.signatureFileKey); if (hash(signature) !== operation.outputHash) throw new Error("SIGNATURE_HASH_MISMATCH"); const verification = await this.provider.verifyCades(document, signature); if (verification.status !== "VALID") throw new Error("INVALID_SIGNATURE"); return { operation, signature, certificate, outputHash: operation.outputHash, idempotent: true }; }
    const staleBoundary = new Date(Date.now() - STALE_AFTER_MS);
    const [locked] = await db.update(signatureOperations).set({ status: "PROCESSING", startedAt: new Date(), lastAttemptAt: new Date(), lastErrorCode: null }).where(and(eq(signatureOperations.id, operation.id), or(inArray(signatureOperations.status, ["PENDING", "FAILED"]), and(eq(signatureOperations.status, "PROCESSING"), lt(signatureOperations.startedAt, staleBoundary))))).returning();
    if (!locked) throw new Error("SIGNATURE_ALREADY_PROCESSING");
    try { const result = await this.provider.signCades({ document, documentId, documentType }); const verification = await this.provider.verifyCades(document, result.signature); if (verification.status !== "VALID") throw new Error("SIGNATURE_VALIDATION_FAILED"); const outputHash = hash(result.signature); await putPrivateObject(signatureFileKey, result.signature, "application/pkcs7-signature", { documentType, documentId, inputHash, outputHash, certificateSerialNumber: certificate.serialNumber }); const stored = await getPrivateObjectBytes(signatureFileKey); if (hash(stored) !== outputHash || (await this.provider.verifyCades(document, stored)).status !== "VALID") throw new Error("SIGNATURE_POST_STORAGE_VALIDATION_FAILED"); const [completed] = await db.update(signatureOperations).set({ status: "SIGNED", outputHash, signatureFileKey, completedAt: new Date(), nextRetryAt: null }).where(eq(signatureOperations.id, operation.id)).returning(); return { operation: completed!, signature: stored, certificate, outputHash, idempotent: false }; }
    catch (error) { const count = operation.retryCount + 1; await db.update(signatureOperations).set({ status: "FAILED", retryCount: count, lastErrorCode: error instanceof Error ? error.message.slice(0, 80) : "SIGNATURE_FAILED", nextRetryAt: retryAt(count), completedAt: new Date() }).where(eq(signatureOperations.id, operation.id)); throw error; }
  }

  async signPades(documentId: string, pdf: Uint8Array, outputFileKey: string) {
    assertSignatureMapping("POINT_RECEIPT", "PADES"); const inputHash = hash(pdf); const certificate = await this.provider.certificateInfo();
    const [metadata] = await db.select({ status: certificateMetadata.status }).from(certificateMetadata).where(eq(certificateMetadata.serialNumber, certificate.serialNumber)).limit(1); if (metadata?.status === "DISABLED" || metadata?.status === "REVOKED") throw new Error("CERTIFICATE_DISABLED");
    const [reserved] = await db.insert(signatureOperations).values({ documentType: "POINT_RECEIPT", documentId, signatureType: "PADES", status: "PENDING", certificateSerialNumber: certificate.serialNumber, certificateSubject: certificate.subject, inputHash, provider: "OPENSSL_A1", implementationVersion: SIGNATURE_IMPLEMENTATION_VERSION, softwareVersion: SOFTWARE_VERSION }).onConflictDoNothing().returning();
    const operation = reserved ?? (await db.select().from(signatureOperations).where(and(eq(signatureOperations.documentType, "POINT_RECEIPT"), eq(signatureOperations.documentId, documentId), eq(signatureOperations.signatureType, "PADES"), eq(signatureOperations.inputHash, inputHash), eq(signatureOperations.certificateSerialNumber, certificate.serialNumber))).limit(1))[0]; if (!operation) throw new Error("SIGNATURE_OPERATION_NOT_RESERVED");
    if (operation.status === "SIGNED" && operation.signatureFileKey && operation.outputHash) { const signedPdf = await getPrivateObjectBytes(operation.signatureFileKey); if (hash(signedPdf) !== operation.outputHash || (await this.provider.verifyPades(signedPdf)).status !== "VALID") throw new Error("INVALID_SIGNATURE"); return { operation, signedPdf, certificate, outputHash: operation.outputHash, inputHash, idempotent: true }; }
    const staleBoundary = new Date(Date.now() - STALE_AFTER_MS); const [locked] = await db.update(signatureOperations).set({ status: "PROCESSING", startedAt: new Date(), lastAttemptAt: new Date(), lastErrorCode: null }).where(and(eq(signatureOperations.id, operation.id), or(inArray(signatureOperations.status, ["PENDING", "FAILED"]), and(eq(signatureOperations.status, "PROCESSING"), lt(signatureOperations.startedAt, staleBoundary))))).returning(); if (!locked) throw new Error("SIGNATURE_ALREADY_PROCESSING");
    try { const result = await this.provider.signPades({ pdf, documentId, documentType: "POINT_RECEIPT" }); if ((await this.provider.verifyPades(result.signedPdf)).status !== "VALID") throw new Error("SIGNATURE_VALIDATION_FAILED"); const outputHash = hash(result.signedPdf); await putPrivateObject(outputFileKey, result.signedPdf, "application/pdf", { documentType: "POINT_RECEIPT", documentId, inputHash, outputHash, certificateSerialNumber: certificate.serialNumber }); const stored = await getPrivateObjectBytes(outputFileKey); if (hash(stored) !== outputHash || (await this.provider.verifyPades(stored)).status !== "VALID") throw new Error("SIGNATURE_POST_STORAGE_VALIDATION_FAILED"); const [completed] = await db.update(signatureOperations).set({ status: "SIGNED", outputHash, signatureFileKey: outputFileKey, completedAt: new Date(), nextRetryAt: null }).where(eq(signatureOperations.id, operation.id)).returning(); return { operation: completed!, signedPdf: stored, certificate, outputHash, inputHash, idempotent: false }; }
    catch (error) { const count = operation.retryCount + 1; await db.update(signatureOperations).set({ status: "FAILED", retryCount: count, lastErrorCode: error instanceof Error ? error.message.slice(0, 80) : "SIGNATURE_FAILED", nextRetryAt: retryAt(count), completedAt: new Date() }).where(eq(signatureOperations.id, operation.id)); throw error; }
  }

  async pendingOperations(documentType?: DocumentType) { return db.select().from(signatureOperations).where(and(inArray(signatureOperations.status, ["PENDING", "FAILED"]), documentType ? eq(signatureOperations.documentType, documentType) : undefined)); }
}
