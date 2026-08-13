import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { absenceJustifications, absences, employees, medicalCertificates, users } from "@/db/schema";
import type { MedicalCertificateUploadInput } from "@/validations/medical-certificate";
import { recordAudit } from "./audit.service";
import { createPrivateDownloadUrl, createPrivateUploadUrl, deletePrivateObject, inspectPrivateObject } from "./object-storage.service";

function safeExtension(contentType: string) { return contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : "jpg"; }
function retentionDate(from: string) { const date = new Date(`${from}T00:00:00Z`); date.setUTCFullYear(date.getUTCFullYear() + 5); return date.toISOString().slice(0, 10); }
function datesBetween(start: string, end: string) { const result: string[] = []; const date = new Date(`${start}T00:00:00Z`); const last = new Date(`${end}T00:00:00Z`); while (date <= last) { result.push(date.toISOString().slice(0, 10)); date.setUTCDate(date.getUTCDate() + 1); } return result; }

export async function prepareMedicalCertificateUpload(input: MedicalCertificateUploadInput, uploadedBy: string) {
  const [employee] = await db.select({ id: employees.id }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
  if (!employee) throw new Error("Funcionário não encontrado.");
  if (input.absenceId) {
    const [absence] = await db.select({ id: absences.id }).from(absences).where(and(eq(absences.id, input.absenceId), eq(absences.employeeId, input.employeeId), gte(absences.date, input.startDate), lte(absences.date, input.endDate))).limit(1);
    if (!absence) throw new Error("A falta selecionada não pertence ao funcionário ou ao período informado.");
  }
  const key = `medical-certificates/${input.employeeId}/${crypto.randomUUID()}.${safeExtension(input.contentType)}`;
  const uploadUrl = await createPrivateUploadUrl(key, input.contentType);
  return { key, uploadUrl, expiresInSeconds: 300, uploadedBy };
}

export async function confirmMedicalCertificate(input: MedicalCertificateUploadInput & { fileKey: string }, performedBy: string) {
  const expectedPrefix = `medical-certificates/${input.employeeId}/`;
  if (!input.fileKey.startsWith(expectedPrefix) || input.fileKey.includes("..")) throw new Error("Chave de arquivo inválida.");
  const object = await inspectPrivateObject(input.fileKey);
  if (object.size !== input.fileSize || object.contentType !== input.contentType) {
    await deletePrivateObject(input.fileKey);
    throw new Error("O arquivo recebido não corresponde aos dados autorizados.");
  }
  try {
    return await db.transaction(async (tx) => {
      const [employee] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
      if (!employee) throw new Error("Funcionário não encontrado.");
      let linkedAbsenceId = input.absenceId;
      if (linkedAbsenceId) {
        const [absence] = await tx.select({ id: absences.id }).from(absences).where(and(eq(absences.id, linkedAbsenceId), eq(absences.employeeId, input.employeeId), gte(absences.date, input.startDate), lte(absences.date, input.endDate))).limit(1);
        if (!absence) throw new Error("Falta incompatível com o atestado.");
      } else {
        const [absence] = await tx.select({ id: absences.id }).from(absences).where(and(eq(absences.employeeId, input.employeeId), gte(absences.date, input.startDate), lte(absences.date, input.endDate))).limit(1);
        linkedAbsenceId = absence?.id;
      }
      for (const date of datesBetween(input.startDate, input.endDate)) {
        const [current] = await tx.select().from(absences).where(and(eq(absences.employeeId, input.employeeId), eq(absences.date, date))).limit(1);
        const [absence] = current
          ? await tx.update(absences).set({ decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy, decidedAt: new Date() }).where(eq(absences.id, current.id)).returning()
          : await tx.insert(absences).values({ employeeId: input.employeeId, date, decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy }).returning();
        if (!absence) throw new Error("Não foi possível vincular o período às ausências.");
        if (!linkedAbsenceId) linkedAbsenceId = absence.id;
        await tx.insert(absenceJustifications).values({ absenceId: absence.id, decision: "MEDICAL_CERTIFICATE", reason: "Atestado médico anexado e aprovado pelo administrador.", approvedBy: performedBy });
      }
      const [saved] = await tx.insert(medicalCertificates).values({ employeeId: input.employeeId, absenceId: linkedAbsenceId, startDate: input.startDate, endDate: input.endDate, description: input.description || null, fileKey: input.fileKey, fileName: input.fileName, contentType: input.contentType, fileSize: input.fileSize, uploadedBy: performedBy, approvedBy: performedBy, retentionUntil: retentionDate(input.endDate) }).returning();
      if (!saved) throw new Error("Não foi possível registrar o atestado.");
      await recordAudit(tx, { action: "CREATE_MEDICAL_CERTIFICATE", entity: "MedicalCertificate", entityId: saved.id, performedBy, after: { employeeId: saved.employeeId, absenceId: saved.absenceId, startDate: saved.startDate, endDate: saved.endDate, contentType: saved.contentType, fileSize: saved.fileSize, retentionUntil: saved.retentionUntil }, reason: "Atestado anexado e aprovado pelo administrador" });
      return saved;
    });
  } catch (error) {
    await deletePrivateObject(input.fileKey).catch(() => undefined);
    throw error;
  }
}

export async function listMedicalCertificates(input: { employeeId?: string } = {}) {
  return db.select({ id: medicalCertificates.id, employeeId: medicalCertificates.employeeId, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, absenceId: medicalCertificates.absenceId, startDate: medicalCertificates.startDate, endDate: medicalCertificates.endDate, description: medicalCertificates.description, fileName: medicalCertificates.fileName, contentType: medicalCertificates.contentType, fileSize: medicalCertificates.fileSize, approvedAt: medicalCertificates.approvedAt, approvedByName: users.name, retentionUntil: medicalCertificates.retentionUntil })
    .from(medicalCertificates).innerJoin(employees, eq(employees.id, medicalCertificates.employeeId)).innerJoin(users, eq(users.id, medicalCertificates.approvedBy))
    .where(input.employeeId ? eq(medicalCertificates.employeeId, input.employeeId) : undefined).orderBy(desc(medicalCertificates.createdAt));
}

export async function getMedicalCertificateDownload(id: string) {
  const [item] = await db.select({ fileKey: medicalCertificates.fileKey, fileName: medicalCertificates.fileName }).from(medicalCertificates).where(eq(medicalCertificates.id, id)).limit(1);
  if (!item) return undefined;
  return createPrivateDownloadUrl(item.fileKey, item.fileName);
}
