import { z } from "zod";

const date = /^\d{4}-\d{2}-\d{2}$/;
const time = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleExceptionSchema = z.object({
  employeeId: z.uuid("Selecione um funcionário."),
  date: z.string().regex(date, "Informe uma data válida."),
  type: z.enum(["WORK", "OFF"]),
  startTime: z.string().regex(time, "Informe uma entrada válida.").optional(),
  endTime: z.string().regex(time, "Informe uma saída válida.").optional(),
  breakStartTime: z.string().regex(time, "Informe o início do intervalo.").optional(),
  breakEndTime: z.string().regex(time, "Informe o fim do intervalo.").optional(),
  toleranceMinutes: z.coerce.number().int().min(0).max(120),
  reason: z.string().trim().min(5, "Explique o motivo em pelo menos 5 caracteres.").max(500),
}).superRefine((value, context) => {
  if (value.type === "OFF") return;
  if (!value.startTime || !value.endTime) context.addIssue({ code: "custom", message: "Informe entrada e saída para o trabalho excepcional.", path: ["startTime"] });
  if (value.startTime && value.endTime && value.startTime >= value.endTime) context.addIssue({ code: "custom", message: "A saída deve ser posterior à entrada.", path: ["endTime"] });
  if (Boolean(value.breakStartTime) !== Boolean(value.breakEndTime)) context.addIssue({ code: "custom", message: "Informe o início e o fim do intervalo.", path: ["breakStartTime"] });
  if (value.breakStartTime && value.breakEndTime && (value.breakStartTime >= value.breakEndTime || value.breakStartTime <= (value.startTime ?? "") || value.breakEndTime >= (value.endTime ?? ""))) context.addIssue({ code: "custom", message: "O intervalo deve estar dentro da jornada.", path: ["breakStartTime"] });
});

export type ScheduleExceptionInput = z.infer<typeof scheduleExceptionSchema>;
