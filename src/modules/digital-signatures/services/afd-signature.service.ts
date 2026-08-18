import "server-only";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { afdGenerations } from "@/db/schema";
import { validateSerializedAfd } from "@/modules/afd/validators/afd.validator";
import { recordAudit } from "@/services/audit.service";
import { createPrivateDownloadUrl, getPrivateObjectBytes } from "@/services/object-storage.service";
import { DigitalSignatureService } from "./digital-signature.service";

function hash(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
export async function signAfdGeneration(id: string, performedBy: string, signatures = new DigitalSignatureService()) {
  const [generation] = await db.select().from(afdGenerations).where(eq(afdGenerations.id, id)).limit(1); if (!generation?.fileKey || !generation.fileHash || !generation.fileName || !["GENERATED", "SIGNED"].includes(generation.status)) throw new Error("AFD_NOT_READY_FOR_SIGNATURE"); const document = await getPrivateObjectBytes(generation.fileKey); if (hash(document) !== generation.fileHash) throw new Error("DOCUMENT_INTEGRITY_MISMATCH"); const validation = validateSerializedAfd(document); if (validation.some((issue) => issue.severity === "ERROR")) throw new Error("INVALID_AFD"); await recordAudit(db, { action: "AFD_SIGNATURE_STARTED", entity: "AFD_GENERATION", entityId: id, performedBy, after: { inputHash: generation.fileHash } });
  try { const result = await signatures.signCades("AFD", id, document, `${generation.fileKey}.p7s`); await db.update(afdGenerations).set({ status: "SIGNED", signatureStatus: "SIGNED", signatureFileKey: result.operation.signatureFileKey, signatureHash: result.outputHash, certificateIdentifier: result.certificate.serialNumber, signedAt: result.operation.completedAt ?? new Date() }).where(eq(afdGenerations.id, id)); await recordAudit(db, { action: "AFD_SIGNED", entity: "AFD_GENERATION", entityId: id, performedBy, after: { inputHash: generation.fileHash, signatureHash: result.outputHash, certificateSerialNumber: result.certificate.serialNumber } }); return result; }
  catch (error) { await db.update(afdGenerations).set({ signatureStatus: "FAILED" }).where(eq(afdGenerations.id, id)); await recordAudit(db, { action: "AFD_SIGNATURE_FAILED", entity: "AFD_GENERATION", entityId: id, performedBy, after: { reasonCode: error instanceof Error ? error.message : "SIGNATURE_FAILED" } }); throw error; }
}
export async function downloadAfdSignature(id: string, performedBy: string) { const [generation] = await db.select().from(afdGenerations).where(eq(afdGenerations.id, id)).limit(1); if (!generation?.signatureFileKey || !generation.signatureHash || generation.signatureStatus !== "SIGNED") return undefined; const signature = await getPrivateObjectBytes(generation.signatureFileKey); if (hash(signature) !== generation.signatureHash) throw new Error("SIGNATURE_HASH_MISMATCH"); await recordAudit(db, { action: "AFD_SIGNATURE_DOWNLOADED", entity: "AFD_GENERATION", entityId: id, performedBy, after: { signatureHash: generation.signatureHash } }); return createPrivateDownloadUrl(generation.signatureFileKey, `${generation.fileName}.p7s`); }
