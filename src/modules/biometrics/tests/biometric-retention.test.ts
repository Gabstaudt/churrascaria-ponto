import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const { db } = await import("@/db");
const { biometricTemplates, biometricValidations, employeeBiometricProfiles, employees, establishments, repCollectors, repRegistrars, users } = await import("@/db/schema");
const { eq } = await import("drizzle-orm");
const { purgeExpiredBiometricData, pendingRetentionCounts } = await import("../services/biometric-retention.service");

describe("expurgo de dados biométricos conforme política de retenção (integração com Postgres local)", () => {
  const suffix = randomUUID().slice(0, 8);
  let userId = ""; let employeeId = ""; let establishmentId = ""; let registrarId = ""; let collectorId = "";
  let profileId = ""; let freshTemplateId = ""; let staleTemplateId = ""; let activeTemplateId = "";

  beforeAll(async () => {
    const [user] = await db.insert(users).values({ name: `Retenção Teste ${suffix}`, email: `retencao-${suffix}@teste.local` }).returning(); userId = user!.id;
    const [employee] = await db.insert(employees).values({ fullName: `Funcionário Retenção ${suffix}`, cpf: suffix.padStart(11, "0").slice(0, 11), position: "Teste", registrationNumber: `RET-${suffix}`, admissionDate: "2026-01-01" }).returning(); employeeId = employee!.id;
    const [establishment] = await db.insert(establishments).values({ name: `Estabelecimento Retenção ${suffix}`, cnpj: suffix.padStart(14, "0").slice(0, 14) }).returning(); establishmentId = establishment!.id;
    const [registrar] = await db.insert(repRegistrars).values({ establishmentId, name: `Registrador ${suffix}`, mode: "REP_P", identifier: `REG-${suffix}`, createdBy: userId }).returning(); registrarId = registrar!.id;
    const [collector] = await db.insert(repCollectors).values({ registrarId, name: `Coletor ${suffix}`, deviceIdentifier: `DEV-${suffix}`, credentialHash: `hash-${suffix}`, credentialPrefix: suffix.slice(0, 8) }).returning(); collectorId = collector!.id;

    const [profile] = await db.insert(employeeBiometricProfiles).values({ employeeId, status: "REVOKED", templateVersion: "1", algorithmVersion: "test", provider: "TEST", privacyNoticeVersion: "2026.1", policyVersion: "2026.1", createdBy: userId }).returning(); profileId = profile!.id;

    const longAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const [stale] = await db.insert(biometricTemplates).values({ biometricProfileId: profileId, encryptedTemplate: "cifrado-antigo", encryptionVersion: "v1", provider: "TEST", algorithmVersion: "test", revokedAt: longAgo }).returning(); staleTemplateId = stale!.id;
    const [fresh] = await db.insert(biometricTemplates).values({ biometricProfileId: profileId, encryptedTemplate: "cifrado-recente", encryptionVersion: "v1", provider: "TEST", algorithmVersion: "test", revokedAt: new Date() }).returning(); freshTemplateId = fresh!.id;
    const [active] = await db.insert(biometricTemplates).values({ biometricProfileId: profileId, encryptedTemplate: "cifrado-ativo", encryptionVersion: "v1", provider: "TEST", algorithmVersion: "test" }).returning(); activeTemplateId = active!.id;

    await db.insert(biometricValidations).values({ attemptId: randomUUID(), employeeId, collectorId, method: "FACE_1_N", provider: "TEST", livenessStatus: "PASSED", matchStatus: "APPROVED", capturedAt: longAgo, expiresAt: longAgo, createdAt: longAgo });
    await db.insert(biometricValidations).values({ attemptId: randomUUID(), employeeId, collectorId, method: "FACE_1_N", provider: "TEST", livenessStatus: "PASSED", matchStatus: "APPROVED", capturedAt: new Date(), expiresAt: new Date() });
  });

  afterAll(async () => {
    await db.delete(biometricTemplates).where(eq(biometricTemplates.biometricProfileId, profileId));
    await db.delete(biometricValidations).where(eq(biometricValidations.collectorId, collectorId));
    await db.delete(employeeBiometricProfiles).where(eq(employeeBiometricProfiles.id, profileId));
    await db.delete(repCollectors).where(eq(repCollectors.id, collectorId));
    await db.delete(repRegistrars).where(eq(repRegistrars.id, registrarId));
    await db.delete(establishments).where(eq(establishments.id, establishmentId));
    await db.delete(employees).where(eq(employees.id, employeeId));
    await db.delete(users).where(eq(users.id, userId));
  });

  it("relata quantos registros ultrapassaram a política antes de expurgar", async () => {
    const pending = await pendingRetentionCounts();
    expect(pending.templatesPastRetention).toBeGreaterThanOrEqual(1);
    expect(pending.validationsPastRetention).toBeGreaterThanOrEqual(1);
  });

  it("apaga apenas templates revogados há mais tempo que a retenção definida, preservando os demais", async () => {
    const result = await purgeExpiredBiometricData();
    expect(result.purgedTemplates).toBeGreaterThanOrEqual(1);

    const remaining = await db.select({ id: biometricTemplates.id }).from(biometricTemplates).where(eq(biometricTemplates.biometricProfileId, profileId));
    const remainingIds = remaining.map((row) => row.id);
    expect(remainingIds).not.toContain(staleTemplateId);
    expect(remainingIds).toContain(freshTemplateId);
    expect(remainingIds).toContain(activeTemplateId);
  });

  it("anonimiza (não apaga) validações antigas, preservando a evidência estatística sem o vínculo pessoal", async () => {
    await purgeExpiredBiometricData();
    const boundary = Date.now() - 300 * 24 * 60 * 60 * 1000;
    const rows = await db.select({ employeeId: biometricValidations.employeeId, capturedAt: biometricValidations.capturedAt }).from(biometricValidations).where(eq(biometricValidations.collectorId, collectorId));
    expect(rows).toHaveLength(2);
    const old = rows.find((row) => row.capturedAt.getTime() < boundary);
    const recent = rows.find((row) => row.capturedAt.getTime() >= boundary);
    expect(old?.employeeId).toBeNull();
    expect(recent?.employeeId).toBe(employeeId);
  });
});
