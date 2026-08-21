import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoTime = /^\d{2}:\d{2}$/;

export const overtimePeriodCreateSchema = z.object({
  employeeId: z.uuid("Selecione um funcionário."),
  date: z.string().regex(isoDate, "Informe uma data válida."),
  startTime: z.string().regex(isoTime, "Informe um horário de início válido."),
  endTime: z.string().regex(isoTime, "Informe um horário de fim válido."),
  reason: z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(500),
}).superRefine((value, context) => {
  if (value.endTime <= value.startTime) context.addIssue({ code: "custom", message: "O fim deve ser depois do início.", path: ["endTime"] });
});

export const overtimePeriodIdSchema = z.uuid("Registro inválido.");
export type OvertimePeriodCreateInput = z.infer<typeof overtimePeriodCreateSchema>;
