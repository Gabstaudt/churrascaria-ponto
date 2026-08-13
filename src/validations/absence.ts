import { z } from "zod";
export const absenceDecisionSchema = z.object({ employeeId: z.uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), decision: z.enum(["UNJUSTIFIED", "JUSTIFIED", "MEDICAL_CERTIFICATE", "DAY_OFF", "VACATION", "LEAVE", "TIME_ENTRY_ERROR", "OTHER"]), reason: z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(1000) });
export type AbsenceDecisionInput = z.infer<typeof absenceDecisionSchema>;
