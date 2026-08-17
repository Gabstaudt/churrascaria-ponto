import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const { db } = await import("@/db");
const { auditLogs, biometricTemplates, employeeBiometricProfiles, employees, users } = await import("@/db/schema");
const { eq } = await import("drizzle-orm");
const { activeBiometricCandidateRows, revokeEmployeeBiometric } = await import("../services/biometric.service");
const { updateEmployee } = await import("@/services/employee.service");

describe("exclusão de biometria revogada/desligada da identificação (integração com Postgres local)", () => {
  const suffix = randomUUID().slice(0, 8);
  let userId = ""; let employeeId = ""; let profileId = "";

  beforeAll(async () => {
    const [user] = await db.insert(users).values({ name: `Revogação Teste ${suffix}`, email: `revogacao-${suffix}@teste.local` }).returning(); userId = user!.id;
    const [employee] = await db.insert(employees).values({ fullName: `Funcionário Revogação ${suffix}`, cpf: suffix.padStart(11, "1").slice(0, 11), position: "Teste", registrationNumber: `REV-${suffix}`, admissionDate: "2026-01-01" }).returning(); employeeId = employee!.id;
    const [profile] = await db.insert(employeeBiometricProfiles).values({ employeeId, status: "ACTIVE", templateVersion: "1", algorithmVersion: "test", provider: "TEST", privacyNoticeVersion: "2026.1", policyVersion: "2026.1", createdBy: userId }).returning(); profileId = profile!.id;
    await db.insert(biometricTemplates).values({ biometricProfileId: profileId, encryptedTemplate: "cifrado-teste", encryptionVersion: "v1", provider: "TEST", algorithmVersion: "test" });
  });

  afterAll(async () => {
    await db.delete(biometricTemplates).where(eq(biometricTemplates.biometricProfileId, profileId));
    await db.delete(employeeBiometricProfiles).where(eq(employeeBiometricProfiles.id, profileId));
    await db.delete(employees).where(eq(employees.id, employeeId));
    await db.delete(auditLogs).where(eq(auditLogs.performedBy, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  it("funcionário ativo com biometria ativa aparece como candidato", async () => {
    const rows = await activeBiometricCandidateRows();
    expect(rows.some((row) => row.employeeId === employeeId)).toBe(true);
  });

  it("biometria revogada deixa de ser utilizável para identificação", async () => {
    const revoked = await revokeEmployeeBiometric(employeeId);
    expect(revoked?.status).toBe("REVOKED");
    const rows = await activeBiometricCandidateRows();
    expect(rows.some((row) => row.employeeId === employeeId)).toBe(false);

    // recadastro implícito: reativar para o próximo teste verificar o desligamento de ponta a ponta
    await db.update(employeeBiometricProfiles).set({ status: "ACTIVE", revokedAt: null }).where(eq(employeeBiometricProfiles.id, profileId));
    await db.update(biometricTemplates).set({ revokedAt: null }).where(eq(biometricTemplates.biometricProfileId, profileId));
  });

  it("desligar o funcionário (status TERMINATED) revoga a biometria automaticamente e a remove da identificação", async () => {
    const [current] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    await updateEmployee(employeeId, {
      fullName: current!.fullName, cpf: current!.cpf, phone: current!.phone ?? undefined, position: current!.position,
      registrationNumber: current!.registrationNumber, admissionDate: current!.admissionDate, status: "TERMINATED",
      workCardNumber: current!.workCardNumber ?? undefined, emergencyContactName: current!.emergencyContactName ?? undefined,
      emergencyContactRelationship: current!.emergencyContactRelationship ?? undefined, emergencyContactPhone: current!.emergencyContactPhone ?? undefined,
    }, userId);

    const [profile] = await db.select().from(employeeBiometricProfiles).where(eq(employeeBiometricProfiles.id, profileId)).limit(1);
    expect(profile!.status).toBe("REVOKED");

    const rows = await activeBiometricCandidateRows();
    expect(rows.some((row) => row.employeeId === employeeId)).toBe(false);
  });
});
