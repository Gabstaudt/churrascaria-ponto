import "server-only";
import { and, count, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { biometricTemplates, biometricValidations } from "@/db/schema";
import { recordAudit } from "@/services/audit.service";
import { retentionBoundary, revokedTemplateRetentionDays, validationEvidenceRetentionDays } from "../policy/biometric-retention-policy";

export async function purgeExpiredBiometricData(performedBy?: string, now = new Date()) {
  const templateBoundary = retentionBoundary(revokedTemplateRetentionDays(), now);
  const validationBoundary = retentionBoundary(validationEvidenceRetentionDays(), now);

  const purgedTemplates = await db.delete(biometricTemplates)
    .where(and(isNotNull(biometricTemplates.revokedAt), lt(biometricTemplates.revokedAt, templateBoundary)))
    .returning({ id: biometricTemplates.id });

  const anonymizedValidations = await db.update(biometricValidations)
    .set({ employeeId: null })
    .where(and(isNotNull(biometricValidations.employeeId), lt(biometricValidations.createdAt, validationBoundary)))
    .returning({ id: biometricValidations.id });

  const result = { purgedTemplates: purgedTemplates.length, anonymizedValidations: anonymizedValidations.length, templateBoundary, validationBoundary };

  if (performedBy && (result.purgedTemplates > 0 || result.anonymizedValidations > 0)) {
    await recordAudit(db, {
      action: "BIOMETRIC_DELETED",
      entity: "BIOMETRIC_RETENTION_POLICY",
      entityId: "scheduled-purge",
      performedBy,
      after: { purgedTemplates: result.purgedTemplates, anonymizedValidations: result.anonymizedValidations },
    });
  }
  return result;
}

export async function pendingRetentionCounts(now = new Date()) {
  const templateBoundary = retentionBoundary(revokedTemplateRetentionDays(), now);
  const validationBoundary = retentionBoundary(validationEvidenceRetentionDays(), now);
  const [[templates], [validations]] = await Promise.all([
    db.select({ value: count() }).from(biometricTemplates).where(and(isNotNull(biometricTemplates.revokedAt), lt(biometricTemplates.revokedAt, templateBoundary))),
    db.select({ value: count() }).from(biometricValidations).where(and(isNotNull(biometricValidations.employeeId), lt(biometricValidations.createdAt, validationBoundary))),
  ]);
  return { templatesPastRetention: templates?.value ?? 0, validationsPastRetention: validations?.value ?? 0 };
}
