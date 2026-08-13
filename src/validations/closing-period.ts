import { z } from "zod";
export const closingReferenceMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência inválida.");
export const closingPeriodIdSchema = z.uuid();
export const reopeningReasonSchema = z.string().trim().min(10, "Informe um motivo com pelo menos 10 caracteres.").max(500);
