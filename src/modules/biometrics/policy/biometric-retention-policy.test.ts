import { afterEach, describe, expect, it } from "vitest";
import { retentionBoundary, revokedTemplateRetentionDays, validationEvidenceRetentionDays } from "./biometric-retention-policy";

const ORIGINAL_ENV = { ...process.env };

describe("política de retenção biométrica", () => {
  afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

  it("usa períodos padrão quando não configurado", () => {
    delete process.env.BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS; delete process.env.BIOMETRIC_VALIDATION_RETENTION_DAYS;
    expect(revokedTemplateRetentionDays()).toBe(30);
    expect(validationEvidenceRetentionDays()).toBe(180);
  });

  it("respeita configuração por ambiente", () => {
    process.env.BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS = "10";
    process.env.BIOMETRIC_VALIDATION_RETENTION_DAYS = "365";
    expect(revokedTemplateRetentionDays()).toBe(10);
    expect(validationEvidenceRetentionDays()).toBe(365);
  });

  it("ignora configuração inválida e cai no padrão seguro", () => {
    process.env.BIOMETRIC_REVOKED_TEMPLATE_RETENTION_DAYS = "não-é-um-número";
    expect(revokedTemplateRetentionDays()).toBe(30);
    process.env.BIOMETRIC_VALIDATION_RETENTION_DAYS = "-5";
    expect(validationEvidenceRetentionDays()).toBe(180);
  });

  it("calcula a data-limite corretamente", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    expect(retentionBoundary(30, now).toISOString()).toBe("2026-07-18T12:00:00.000Z");
  });
});
