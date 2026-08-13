import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
export const availabilityCreateSchema = z.object({
  kind: z.enum(["DAY_OFF", "SWAP", "VACATION", "LEAVE"]),
  employeeId: z.uuid("Selecione um funcionário."),
  date: z.string().regex(isoDate).optional(),
  startDate: z.string().regex(isoDate).optional(),
  endDate: z.string().regex(isoDate).optional(),
  workDate: z.string().regex(isoDate).optional(),
  leaveType: z.enum(["MEDICAL", "PERSONAL", "LEGAL", "OTHER"]).optional(),
  reason: z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(500),
}).superRefine((value, context) => {
  if ((value.kind === "DAY_OFF" || value.kind === "SWAP") && !value.date) context.addIssue({ code: "custom", message: "Informe a data da folga.", path: ["date"] });
  if (value.kind === "SWAP" && !value.workDate) context.addIssue({ code: "custom", message: "Informe a data compensada de trabalho.", path: ["workDate"] });
  if (value.kind === "SWAP" && value.date === value.workDate) context.addIssue({ code: "custom", message: "As datas da troca devem ser diferentes.", path: ["workDate"] });
  if ((value.kind === "VACATION" || value.kind === "LEAVE") && (!value.startDate || !value.endDate)) context.addIssue({ code: "custom", message: "Informe o início e o fim do período.", path: ["startDate"] });
  if (value.startDate && value.endDate && value.endDate < value.startDate) context.addIssue({ code: "custom", message: "A data final deve ser posterior à inicial.", path: ["endDate"] });
  if (value.kind === "LEAVE" && !value.leaveType) context.addIssue({ code: "custom", message: "Selecione o tipo de afastamento.", path: ["leaveType"] });
});

export const swapReviewSchema = z.object({ id: z.uuid(), decision: z.enum(["APPROVED", "REJECTED"]), reason: z.string().trim().min(5).max(500) });
export type AvailabilityCreateInput = z.infer<typeof availabilityCreateSchema>;
