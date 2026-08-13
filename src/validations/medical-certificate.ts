import { z } from "zod";

export const MEDICAL_CERTIFICATE_MAX_BYTES = 8 * 1024 * 1024;
export const MEDICAL_CERTIFICATE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export const medicalCertificateUploadSchema = z.object({
  employeeId: z.uuid("Funcionário inválido."),
  absenceId: z.union([z.uuid(), z.literal("")]).optional().transform((value) => value || undefined),
  startDate: z.string().date("Data inicial inválida."),
  endDate: z.string().date("Data final inválida."),
  description: z.string().trim().max(300, "A descrição deve ter até 300 caracteres.").optional(),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(MEDICAL_CERTIFICATE_TYPES, { error: "Envie um arquivo PDF, JPG ou PNG." }),
  fileSize: z.coerce.number().int().positive().max(MEDICAL_CERTIFICATE_MAX_BYTES, "O arquivo deve ter no máximo 8 MB."),
}).refine((data) => data.endDate >= data.startDate, { message: "A data final deve ser igual ou posterior à inicial.", path: ["endDate"] })
  .refine((data) => (new Date(`${data.endDate}T00:00:00Z`).getTime() - new Date(`${data.startDate}T00:00:00Z`).getTime()) / 86_400_000 <= 365, { message: "O período do atestado deve ter no máximo 366 dias.", path: ["endDate"] });

export type MedicalCertificateUploadInput = z.infer<typeof medicalCertificateUploadSchema>;
