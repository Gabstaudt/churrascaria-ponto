"use server";

import { requireAdmin } from "@/auth/session";
import { confirmMedicalCertificate, prepareMedicalCertificateUpload } from "@/services/medical-certificate.service";
import { medicalCertificateUploadSchema } from "@/validations/medical-certificate";

export type CertificateActionResult = { ok: true; key?: string; uploadUrl?: string; id?: string } | { ok: false; message: string };

export async function prepareMedicalCertificateUploadAction(input: unknown): Promise<CertificateActionResult> {
  const session = await requireAdmin();
  const parsed = medicalCertificateUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do atestado." };
  try {
    const prepared = await prepareMedicalCertificateUpload(parsed.data, session.user.id);
    return { ok: true, key: prepared.key, uploadUrl: prepared.uploadUrl };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Não foi possível preparar o envio." }; }
}

export async function confirmMedicalCertificateAction(input: unknown): Promise<CertificateActionResult> {
  const session = await requireAdmin();
  if (!input || typeof input !== "object" || !("fileKey" in input) || typeof input.fileKey !== "string") return { ok: false, message: "Arquivo inválido." };
  const parsed = medicalCertificateUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise os dados do atestado." };
  try {
    const saved = await confirmMedicalCertificate({ ...parsed.data, fileKey: input.fileKey }, session.user.id);
    return { ok: true, id: saved.id };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Não foi possível confirmar o atestado." }; }
}
