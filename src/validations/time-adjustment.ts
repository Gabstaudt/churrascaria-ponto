import { z } from "zod";

const date = /^\d{4}-\d{2}-\d{2}$/;
const time = /^([01]\d|2[0-3]):[0-5]\d$/;
export const timeAdjustmentSchema = z.object({
  employeeId: z.uuid(), date: z.string().regex(date),
  type: z.enum(["ADD_ENTRY", "IGNORE_ENTRY", "FORGOTTEN_EXIT", "JUSTIFY_LATE", "JUSTIFY_EARLY_EXIT"]),
  time: z.string().regex(time, "Informe um horário válido.").optional(),
  originalTimeEntryId: z.uuid("Selecione uma marcação original válida.").optional(),
  reason: z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(500),
}).superRefine((value, context) => {
  if ((value.type === "ADD_ENTRY" || value.type === "FORGOTTEN_EXIT") && !value.time) context.addIssue({ code: "custom", message: "Informe o horário do ajuste.", path: ["time"] });
  if (value.type === "IGNORE_ENTRY" && !value.originalTimeEntryId) context.addIssue({ code: "custom", message: "Selecione a marcação que será desconsiderada.", path: ["originalTimeEntryId"] });
});
export type TimeAdjustmentInput = z.infer<typeof timeAdjustmentSchema>;
