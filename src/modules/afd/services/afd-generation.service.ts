import "server-only";
import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { afdGenerations, establishments, repRegistrars } from "@/db/schema";
import { recordAudit } from "@/services/audit.service";
import { createPrivateDownloadUrl, getPrivateObjectBytes, putPrivateObject } from "@/services/object-storage.service";
import { generateAfdArtifact } from "../generators/afd.generator";
import { AFD_LAYOUT_VERSION } from "../types";
import { validateSerializedAfd } from "../validators/afd.validator";
import { loadAfdSource } from "./afd-data-source.service";
import { afdFileName } from "./afd-file-name.service";
import { reconcileAfd } from "./afd-reconciliation.service";

export async function previewAfd(registrarId: string, startDate: string, endDate: string, now = new Date()) { const source = await loadAfdSource(registrarId, startDate, endDate); return { source, artifact: generateAfdArtifact(source, startDate, endDate, now) }; }

export async function generateOfficialAfd(registrarId: string, startDate: string, endDate: string, generatedBy: string) {
  const now = new Date();
  const source = await loadAfdSource(registrarId, startDate, endDate);
  const [generation] = await db.insert(afdGenerations).values({ registrarId, establishmentId: source.establishment.id, startDate, endDate, layoutVersion: AFD_LAYOUT_VERSION, status: "VALIDATING", signatureStatus: "PENDING", generatedBy }).returning();
  if (!generation) throw new Error("AFD_GENERATION_NOT_RESERVED");
  await recordAudit(db, { action: "AFD_GENERATION_STARTED", entity: "AFD_GENERATION", entityId: generation.id, performedBy: generatedBy, after: { registrarId, startDate, endDate, layoutVersion: AFD_LAYOUT_VERSION } });
  try {
    const artifact = generateAfdArtifact(source, startDate, endDate, now); const reconciliation = reconcileAfd(source, artifact);
    if (!reconciliation.valid) artifact.issues.push({ severity: "ERROR", code: "AFD_RECONCILIATION_FAILED", message: "O arquivo diverge das marcações originárias do REP-P." });
    const errors = artifact.issues.filter((issue) => issue.severity === "ERROR");
    if (errors.length) { await db.update(afdGenerations).set({ status: "FAILED", validationIssues: artifact.issues, recordCount: artifact.recordCount, recordCountByType: artifact.recordCountByType, firstNsr: artifact.firstNsr, lastNsr: artifact.lastNsr }).where(eq(afdGenerations.id, generation.id)); await recordAudit(db, { action: "AFD_VALIDATION_FAILED", entity: "AFD_GENERATION", entityId: generation.id, performedBy: generatedBy, after: { issueCodes: errors.map((item) => item.code), recordCount: artifact.recordCount } }); return { generationId: generation.id, status: "FAILED" as const, artifact }; }
    const fileName = afdFileName(source.registrar.inpiRegistration!, source.employer.id); const hash = createHash("sha256").update(artifact.bytes).digest("hex"); const year = startDate.slice(0, 4); const key = `afd/${source.establishment.id}/${year}/${generation.id}/${fileName}`;
    await putPrivateObject(key, artifact.bytes, "text/plain; charset=iso-8859-1", { generationId: generation.id, sha256: hash, layoutVersion: AFD_LAYOUT_VERSION });
    const stored = await getPrivateObjectBytes(key); const storedHash = createHash("sha256").update(stored).digest("hex"); const postStorageIssues = validateSerializedAfd(stored);
    if (storedHash !== hash || postStorageIssues.some((item) => item.severity === "ERROR")) throw new Error("AFD_POST_STORAGE_VALIDATION_FAILED");
    await db.update(afdGenerations).set({ status: "GENERATED", validationIssues: artifact.issues, recordCount: artifact.recordCount, recordCountByType: artifact.recordCountByType, firstNsr: artifact.firstNsr, lastNsr: artifact.lastNsr, fileName, fileKey: key, fileHash: hash, generatedAt: now }).where(eq(afdGenerations.id, generation.id));
    await recordAudit(db, { action: "AFD_GENERATED", entity: "AFD_GENERATION", entityId: generation.id, performedBy: generatedBy, after: { fileKey: key, fileHash: hash, recordCount: artifact.recordCount, firstNsr: artifact.firstNsr, lastNsr: artifact.lastNsr, signatureStatus: "PENDING" } });
    return { generationId: generation.id, status: "GENERATED" as const, artifact };
  } catch (error) { await db.update(afdGenerations).set({ status: "FAILED", validationIssues: [{ severity: "ERROR", code: "AFD_GENERATION_FAILED", message: "A geração não pôde ser concluída." }] }).where(eq(afdGenerations.id, generation.id)); await recordAudit(db, { action: "AFD_GENERATION_FAILED", entity: "AFD_GENERATION", entityId: generation.id, performedBy: generatedBy, after: { reasonCode: error instanceof Error ? error.message : "UNKNOWN" } }); throw error; }
}

export async function listAfdGenerations() { return db.select({ generation: afdGenerations, registrarName: repRegistrars.name, establishmentName: establishments.name }).from(afdGenerations).innerJoin(repRegistrars, eq(repRegistrars.id, afdGenerations.registrarId)).innerJoin(establishments, eq(establishments.id, afdGenerations.establishmentId)).orderBy(desc(afdGenerations.createdAt)); }
export async function listAfdRegistrars() { return db.select({ id: repRegistrars.id, name: repRegistrars.name, inpiRegistration: repRegistrars.inpiRegistration, establishmentId: establishments.id, establishmentName: establishments.name }).from(repRegistrars).innerJoin(establishments, eq(establishments.id, repRegistrars.establishmentId)).where(eq(repRegistrars.mode, "REP_P")); }
export async function afdOperationalMetrics() { const rows = await db.select({ status: afdGenerations.status, signatureStatus: afdGenerations.signatureStatus, recordCount: afdGenerations.recordCount, createdAt: afdGenerations.createdAt, generatedAt: afdGenerations.generatedAt }).from(afdGenerations); return { afdGenerationsTotal: rows.length, afdGenerationFailures: rows.filter((row) => row.status === "FAILED").length, afdValidationFailures: rows.filter((row) => row.status === "FAILED").length, afdRecordCount: rows.reduce((total, row) => total + row.recordCount, 0), afdPendingSignature: rows.filter((row) => row.status === "GENERATED" && row.signatureStatus === "PENDING").length, afdGenerationDuration: rows.flatMap((row) => row.generatedAt ? [row.generatedAt.getTime() - row.createdAt.getTime()] : []) }; }
export async function getAfdGeneration(id: string) { const [row] = await db.select({ generation: afdGenerations, registrarName: repRegistrars.name, establishmentName: establishments.name }).from(afdGenerations).innerJoin(repRegistrars, eq(repRegistrars.id, afdGenerations.registrarId)).innerJoin(establishments, eq(establishments.id, afdGenerations.establishmentId)).where(eq(afdGenerations.id, id)).limit(1); return row; }
export async function downloadSignedAfd(id: string, userId: string) { const row = await getAfdGeneration(id); if (!row?.generation.fileKey || row.generation.status !== "SIGNED" || row.generation.signatureStatus !== "SIGNED" || !row.generation.fileHash) return undefined; const bytes = await getPrivateObjectBytes(row.generation.fileKey); if (createHash("sha256").update(bytes).digest("hex") !== row.generation.fileHash) throw new Error("AFD_INTEGRITY_MISMATCH"); await recordAudit(db, { action: "AFD_DOWNLOADED", entity: "AFD_GENERATION", entityId: id, performedBy: userId, after: { fileHash: row.generation.fileHash } }); return createPrivateDownloadUrl(row.generation.fileKey, row.generation.fileName ?? "AFD.txt"); }
