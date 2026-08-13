import { z } from "zod";

import { employeeStatusValues } from "@/db/schema/enums";

import { isValidCpf, normalizeCpf } from "./cpf";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 0 || /^\d{10,11}$/.test(value), {
    message: "Informe um telefone válido com DDD.",
  })
  .transform((value) => value || undefined)
  .optional();

export const employeeCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe o nome completo.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  cpf: z
    .string()
    .transform(normalizeCpf)
    .refine(isValidCpf, "Informe um CPF válido."),
  phone: optionalPhoneSchema,
  position: z
    .string()
    .trim()
    .min(2, "Informe o cargo.")
    .max(100, "O cargo deve ter no máximo 100 caracteres."),
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Informe a matrícula.")
    .max(50, "A matrícula deve ter no máximo 50 caracteres."),
  admissionDate: z
    .string()
    .refine(isValidIsoDate, "Informe uma data de admissão válida."),
  status: z.enum(employeeStatusValues).default("ACTIVE"),
  photoUrl: z.url("Informe uma URL de foto válida.").max(2048).optional(),
  isActive: z.boolean().default(true),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = employeeCreateSchema.pick({
  fullName: true,
  cpf: true,
  phone: true,
  position: true,
  registrationNumber: true,
  admissionDate: true,
  status: true,
});

export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

export const employeeIdSchema = z.uuid("Funcionário inválido.");

export const employeeListQuerySchema = z.object({
  query: z.string().trim().max(100).catch(""),
  status: z.enum(employeeStatusValues).optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1),
});
