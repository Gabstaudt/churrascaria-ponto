export const BIOMETRIC_RETENTION_POLICY_VERSION = "2026.1";

export function revokedTemplateRetentionDays() {
  const value = Number(process.env.BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS ?? "30");
  return Number.isFinite(value) && value > 0 ? value : 30;
}

export function validationEvidenceRetentionDays() {
  const value = Number(process.env.BIOMETRIC_VALIDATION_RETENTION_DAYS ?? "180");
  return Number.isFinite(value) && value > 0 ? value : 180;
}

export function retentionBoundary(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
