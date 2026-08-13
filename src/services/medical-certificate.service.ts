import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { absenceJustifications, absences, employees, medicalCertificates, users } from "@/db/schema";
import type { MedicalCertificateUploadInput } from "@/validations/medical-certificate";
import { recordAudit } from "./audit.service";
import { createPrivateDownloadUrl, createPrivateUploadUrl, deletePrivateObject, inspectPrivateObject } from "./object-storage.service";
import { assertPeriodRangeMutable } from "./period-lock.service";

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

export async function confirmMedicalCertificate(input: MedicalCertificateUploadInput & { fileKey: string }, performedBy: string, pendingReview = false) {
  const expectedPrefix = `medical-certificates/${input.employeeId}/`;
  if (!input.fileKey.startsWith(expectedPrefix) || input.fileKey.includes("..")) throw new Error("Chave de arquivo inválida.");
  const object = await inspectPrivateObject(input.fileKey);
  if (object.size !== input.fileSize || object.contentType !== input.contentType) {
    await deletePrivateObject(input.fileKey);
    throw new Error("O arquivo recebido não corresponde aos dados autorizados.");
  }
  try {
    return await db.transaction(async (tx) => {
      await assertPeriodRangeMutable(tx, input.startDate, input.endDate);
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
      if (!pendingReview) for (const date of datesBetween(input.startDate, input.endDate)) {
        const [current] = await tx.select().from(absences).where(and(eq(absences.employeeId, input.employeeId), eq(absences.date, date))).limit(1);
        const [absence] = current
          ? await tx.update(absences).set({ decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy, decidedAt: new Date() }).where(eq(absences.id, current.id)).returning()
          : await tx.insert(absences).values({ employeeId: input.employeeId, date, decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy }).returning();
        if (!absence) throw new Error("Não foi possível vincular o período às ausências.");
        if (!linkedAbsenceId) linkedAbsenceId = absence.id;
        await tx.insert(absenceJustifications).values({ absenceId: absence.id, decision: "MEDICAL_CERTIFICATE", reason: "Atestado médico anexado e aprovado pelo administrador.", approvedBy: performedBy });
      }
      const [saved] = await tx.insert(medicalCertificates).values({ employeeId: input.employeeId, absenceId: linkedAbsenceId, startDate: input.startDate, endDate: input.endDate, description: input.description || null, fileKey: input.fileKey, fileName: input.fileName, contentType: input.contentType, fileSize: input.fileSize, status: pendingReview ? "PENDING" : "APPROVED", uploadedBy: performedBy, approvedBy: pendingReview ? null : performedBy, approvedAt: pendingReview ? null : new Date(), retentionUntil: retentionDate(input.endDate) }).returning();
      if (!saved) throw new Error("Não foi possível registrar o atestado.");
      await recordAudit(tx, { action: pendingReview ? "SUBMIT_MEDICAL_CERTIFICATE" : "CREATE_MEDICAL_CERTIFICATE", entity: "MedicalCertificate", entityId: saved.id, performedBy, after: { employeeId: saved.employeeId, absenceId: saved.absenceId, startDate: saved.startDate, endDate: saved.endDate, contentType: saved.contentType, fileSize: saved.fileSize, status: saved.status, retentionUntil: saved.retentionUntil }, reason: pendingReview ? "Atestado enviado para análise" : "Atestado anexado e aprovado pelo administrador" });
      return saved;
    });
  } catch (error) {
    await deletePrivateObject(input.fileKey).catch(() => undefined);
    throw error;
  }
}

export async function listMedicalCertificates(input: { employeeId?: string } = {}) {
  return db.select({ id: medicalCertificates.id, employeeId: medicalCertificates.employeeId, employeeName: employees.fullName, registrationNumber: employees.registrationNumber, absenceId: medicalCertificates.absenceId, startDate: medicalCertificates.startDate, endDate: medicalCertificates.endDate, description: medicalCertificates.description, fileName: medicalCertificates.fileName, contentType: medicalCertificates.contentType, fileSize: medicalCertificates.fileSize, status: medicalCertificates.status, approvedAt: medicalCertificates.approvedAt, approvedByName: users.name, retentionUntil: medicalCertificates.retentionUntil })
    .from(medicalCertificates).innerJoin(employees, eq(employees.id, medicalCertificates.employeeId)).leftJoin(users, eq(users.id, medicalCertificates.approvedBy))
    .where(input.employeeId ? eq(medicalCertificates.employeeId, input.employeeId) : undefined).orderBy(desc(medicalCertificates.createdAt));
}

export async function getMedicalCertificateDownload(id: string) {
  const [item] = await db.select({ employeeId: medicalCertificates.employeeId, fileKey: medicalCertificates.fileKey, fileName: medicalCertificates.fileName }).from(medicalCertificates).where(eq(medicalCertificates.id, id)).limit(1);
  if (!item) return undefined;
  return { employeeId: item.employeeId, url: await createPrivateDownloadUrl(item.fileKey, item.fileName) };
}

export async function reviewMedicalCertificate(id: string, decision: "APPROVED" | "REJECTED", reason: string, performedBy: string, allowedEmployeeIds?: string[]) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(medicalCertificates).where(and(eq(medicalCertificates.id, id), eq(medicalCertificates.status, "PENDING"))).limit(1);
    if (!current || (allowedEmployeeIds && !allowedEmployeeIds.includes(current.employeeId))) return undefined;
    if (decision === "APPROVED") {
      await assertPeriodRangeMutable(tx, current.startDate, current.endDate);
      let linkedAbsenceId = current.absenceId;
      for (const date of datesBetween(current.startDate, current.endDate)) {
        const [existing] = await tx.select().from(absences).where(and(eq(absences.employeeId, current.employeeId), eq(absences.date, date))).limit(1);
        const [absence] = existing ? await tx.update(absences).set({ decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy, decidedAt: new Date() }).where(eq(absences.id, existing.id)).returning() : await tx.insert(absences).values({ employeeId: current.employeeId, date, decision: "MEDICAL_CERTIFICATE", decidedBy: performedBy }).returning();
        if (!absence) throw new Error("Não foi possível justificar a ausência.");
        if (!linkedAbsenceId) linkedAbsenceId = absence.id;
        await tx.insert(absenceJustifications).values({ absenceId: absence.id, decision: "MEDICAL_CERTIFICATE", reason: `Atestado aprovado: ${reason}`, approvedBy: performedBy });
      }
      await tx.update(medicalCertificates).set({ absenceId: linkedAbsenceId }).where(eq(medicalCertificates.id, id));
    }
    const [saved] = await tx.update(medicalCertificates).set({ status: decision, approvedBy: performedBy, approvedAt: new Date(), reviewReason: reason }).where(eq(medicalCertificates.id, id)).returning();
    await recordAudit(tx, { action: decision === "APPROVED" ? "APPROVE_MEDICAL_CERTIFICATE" : "REJECT_MEDICAL_CERTIFICATE", entity: "MedicalCertificate", entityId: id, performedBy, before: { status: current.status }, after: { status: decision }, reason });
    return { saved, requestedBy: current.uploadedBy };
  });
}
