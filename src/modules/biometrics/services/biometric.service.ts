import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, type Database } from "@/db";
import { biometricTemplates, biometricValidations, employeeBiometricProfiles, employees, establishments, locationValidations, pointRegistrationAttempts, repCollectors, repRegistrars, securityEvents } from "@/db/schema";
import { LocalBiometricProvider } from "../providers/local-biometric.provider";
import { recordRepPEvent } from "@/rep-p/audit.service";
import { issueContingencyTicket } from "@/rep-p/contingency-ticket";
import { minimalEmployeeName } from "@/terminal/privacy";
import { decryptBiometricTemplate, encryptBiometricTemplate } from "./biometric-encryption.service";
import { decideFacialMatch } from "./biometric-policy";
import { redactAuditPayload } from "@/services/audit-redaction";
const provider = new LocalBiometricProvider(); const VALIDATION_TTL_MS = 60_000; const LOCATION_FRESHNESS_MS = 120_000;
export class BiometricDecisionError extends Error { constructor(public code: string, message: string) { super(message); } }
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Writer = Database | Transaction;
// SFace + cosine: o próprio DeepFace calibra o limiar de "mesma pessoa" em distância de
// cosseno 0.593 (LFW), ou seja, similaridade >= 1 - 0.593 ≈ 0.407. O valor anterior (0.80)
// era quase o dobro dessa referência e rejeitava capturas legítimas com pequenas variações
// de luz/cabelo/ângulo. 0.45 mantém uma margem de segurança sobre o limiar calibrado do
// modelo, já compensada pela identificação 1:N (várias pessoas candidatas) e pelo cadastro
// multi-amostra (compara contra o melhor entre várias referências do mesmo funcionário).
function policy() { const value = { minimumSimilarityThreshold: Number(process.env.BIOMETRIC_MIN_SIMILARITY ?? ".45"), minimumScoreGap: Number(process.env.BIOMETRIC_MIN_SCORE_GAP ?? ".08") }; if (!Number.isFinite(value.minimumSimilarityThreshold) || !Number.isFinite(value.minimumScoreGap)) throw new Error("Política biométrica inválida."); return value; }

const MIN_ENROLLMENT_SAMPLES = 3;
export async function enrollEmployeeBiometric(input: { employeeId: string; images: Uint8Array[]; performedBy: string; privacyNoticeVersion: string; policyVersion: string }) {
  if (input.images.length < MIN_ENROLLMENT_SAMPLES) throw new BiometricDecisionError("INSUFFICIENT_SAMPLES", `São necessárias pelo menos ${MIN_ENROLLMENT_SAMPLES} capturas.`);
  const results = [];
  for (const image of input.images) { const result = await provider.enroll(image); if (result.quality !== "GOOD") throw new BiometricDecisionError(result.quality, "Uma das capturas não possui qualidade suficiente."); if (result.liveness.status !== "PASSED") throw new BiometricDecisionError("LIVENESS_FAILED", "A prova de vida não foi aprovada em uma das capturas."); results.push(result); }
  const encryptedTemplates = results.map((result) => encryptBiometricTemplate(result.template)); const { algorithmVersion, provider: providerName } = results[0]!; const now = new Date();
  return db.transaction(async (tx) => { const [existing] = await tx.select().from(employeeBiometricProfiles).where(eq(employeeBiometricProfiles.employeeId, input.employeeId)).limit(1); if (existing) { await tx.update(biometricTemplates).set({ revokedAt: now }).where(and(eq(biometricTemplates.biometricProfileId, existing.id), isNull(biometricTemplates.revokedAt))); const [profile] = await tx.update(employeeBiometricProfiles).set({ status: "ACTIVE", templateVersion: "1", algorithmVersion, provider: providerName, privacyNoticeVersion: input.privacyNoticeVersion, policyVersion: input.policyVersion, acknowledgedAt: now, enrolledAt: now, revokedAt: null, updatedAt: now }).where(eq(employeeBiometricProfiles.id, existing.id)).returning(); for (const encrypted of encryptedTemplates) await tx.insert(biometricTemplates).values({ biometricProfileId: existing.id, encryptedTemplate: encrypted.encrypted, encryptionVersion: encrypted.version, provider: providerName, algorithmVersion }); return { profile: profile!, reenrollment: true }; } const [profile] = await tx.insert(employeeBiometricProfiles).values({ employeeId: input.employeeId, status: "ACTIVE", templateVersion: "1", algorithmVersion, provider: providerName, privacyNoticeVersion: input.privacyNoticeVersion, policyVersion: input.policyVersion, acknowledgedAt: now, enrolledAt: now, createdBy: input.performedBy }).returning(); for (const encrypted of encryptedTemplates) await tx.insert(biometricTemplates).values({ biometricProfileId: profile!.id, encryptedTemplate: encrypted.encrypted, encryptionVersion: encrypted.version, provider: providerName, algorithmVersion }); return { profile: profile!, reenrollment: false }; });
}

async function revokeBiometricWithWriter(writer: Writer, employeeId: string) {
  const now = new Date();
  const [profile] = await writer.update(employeeBiometricProfiles).set({ status: "REVOKED", revokedAt: now, updatedAt: now }).where(eq(employeeBiometricProfiles.employeeId, employeeId)).returning();
  if (profile) await writer.update(biometricTemplates).set({ revokedAt: now }).where(and(eq(biometricTemplates.biometricProfileId, profile.id), isNull(biometricTemplates.revokedAt)));
  return profile;
}
export async function revokeEmployeeBiometric(employeeId: string) { return db.transaction((tx) => revokeBiometricWithWriter(tx, employeeId)); }
export async function revokeEmployeeBiometricInTransaction(tx: Transaction, employeeId: string) { return revokeBiometricWithWriter(tx, employeeId); }

export async function activeBiometricCandidateRows() {
  return db.select({ employeeId: employees.id, fullName: employees.fullName, encryptedTemplate: biometricTemplates.encryptedTemplate }).from(employeeBiometricProfiles).innerJoin(employees, eq(employees.id, employeeBiometricProfiles.employeeId)).innerJoin(biometricTemplates, and(eq(biometricTemplates.biometricProfileId, employeeBiometricProfiles.id), isNull(biometricTemplates.revokedAt))).where(and(eq(employeeBiometricProfiles.status, "ACTIVE"), eq(employees.status, "ACTIVE"), eq(employees.isActive, true)));
}

export async function identifyForPoint(input: { collectorId: string; locationValidationId: string; image: Uint8Array }) {
  const now = new Date(); const [context] = await db.select({ establishmentId: establishments.id }).from(repCollectors).innerJoin(repRegistrars, eq(repRegistrars.id, repCollectors.registrarId)).innerJoin(establishments, eq(establishments.id, repRegistrars.establishmentId)).where(eq(repCollectors.id, input.collectorId)).limit(1); if (!context) throw new BiometricDecisionError("COLLECTOR_INVALID", "Terminal inválido.");
  const [location] = await db.select({ id: locationValidations.id }).from(locationValidations).where(and(eq(locationValidations.id, input.locationValidationId), eq(locationValidations.collectorId, input.collectorId), eq(locationValidations.establishmentId, context.establishmentId), eq(locationValidations.status, "VALID"), gt(locationValidations.validatedAt, new Date(now.getTime() - LOCATION_FRESHNESS_MS)))).limit(1); if (!location) throw new BiometricDecisionError("LOCATION_INVALID", "Localização inválida ou expirada.");
  const [attempt] = await db.insert(pointRegistrationAttempts).values({ collectorId: input.collectorId, establishmentId: context.establishmentId, locationValidationId: location.id, status: "LOCATION_APPROVED", expiresAt: new Date(now.getTime() + VALIDATION_TTL_MS) }).returning();
  const rows = await activeBiometricCandidateRows();
  const candidates = rows.map((row) => ({ employeeId: row.employeeId, template: decryptBiometricTemplate(row.encryptedTemplate) })); const thresholds = policy(); const result = await provider.identify(input.image, candidates, thresholds); result.decision = decideFacialMatch({ bestScore: result.score, secondBestScore: result.secondBestScore, ...thresholds });
  const status = result.detection.faceCount === 0 ? "NO_FACE" : result.detection.faceCount > 1 ? "MULTIPLE_FACES" : result.detection.quality !== "GOOD" ? "LOW_QUALITY" : result.liveness.status !== "PASSED" ? "LIVENESS_FAILED" : result.decision === "AMBIGUOUS" ? "AMBIGUOUS_MATCH" : result.decision === "MATCH" ? "APPROVED" : "NO_MATCH";
  const [validation] = await db.insert(biometricValidations).values({ attemptId: attempt.id, employeeId: status === "APPROVED" ? result.employeeId : null, collectorId: input.collectorId, method: "FACE_1_N", provider: result.provider, livenessStatus: result.liveness.status, livenessScore: result.liveness.score === undefined ? null : String(result.liveness.score), matchStatus: status, similarityScore: result.score === undefined ? null : String(result.score), riskFlags: result.liveness.riskFlags, capturedAt: now, expiresAt: new Date(now.getTime() + VALIDATION_TTL_MS) }).returning();
  const auditType = status === "APPROVED" ? "BIOMETRIC_VERIFICATION_APPROVED" : status === "LIVENESS_FAILED" ? "LIVENESS_FAILED" : status === "AMBIGUOUS_MATCH" ? "AMBIGUOUS_FACE_MATCH" : "BIOMETRIC_VERIFICATION_REJECTED"; await recordRepPEvent(db, { eventType: auditType, outcome: status === "APPROVED" ? "SUCCESS" : "REJECTED", collectorId: input.collectorId, employeeId: status === "APPROVED" ? result.employeeId : undefined, reasonCode: status, metadata: { attemptId: attempt.id, provider: result.provider, algorithmVersion: result.algorithmVersion } }); if (status === "LIVENESS_FAILED") await db.insert(securityEvents).values({ type: result.liveness.riskFlags.some((flag) => flag.toLowerCase().includes("video")) ? "VIDEO_ATTACK" : "PHOTO_ATTACK", severity: "WARNING", collectorId: input.collectorId, attemptId: attempt.id, metadataSafe: redactAuditPayload({ provider: result.provider, riskFlags: result.liveness.riskFlags }) as Record<string, unknown> });
  if (status !== "APPROVED" || !result.employeeId) { await db.update(pointRegistrationAttempts).set({ status: "FAILED", failureReason: status, completedAt: new Date(), biometricValidationId: validation.id, metrics: { faceDetectionDuration: result.detection.durationMs, livenessDuration: result.liveness.durationMs, totalAuthenticationDuration: result.durationMs } }).where(eq(pointRegistrationAttempts.id, attempt.id)); throw new BiometricDecisionError(status, status === "LIVENESS_FAILED" ? "Não foi possível confirmar a prova de vida." : status === "MULTIPLE_FACES" ? "Apenas uma pessoa deve permanecer diante da câmera." : status === "LOW_QUALITY" ? "Melhore a iluminação e mantenha o rosto centralizado." : "Rosto não reconhecido."); }
  const employee = rows.find((row) => row.employeeId === result.employeeId)!; await db.update(pointRegistrationAttempts).set({ status: "BIOMETRIC_APPROVED", biometricValidationId: validation.id, metrics: { faceDetectionDuration: result.detection.durationMs, livenessDuration: result.liveness.durationMs, totalAuthenticationDuration: result.durationMs } }).where(eq(pointRegistrationAttempts.id, attempt.id)); return { attemptId: attempt.id, biometricValidationId: validation.id, employeeId: result.employeeId, displayName: minimalEmployeeName(employee.fullName), expiresAt: validation.expiresAt, contingencyTicket: issueContingencyTicket({ collectorId: input.collectorId, employeeId: result.employeeId, attemptId: attempt.id, locationValidationId: location.id, biometricValidationId: validation.id }) };
}
