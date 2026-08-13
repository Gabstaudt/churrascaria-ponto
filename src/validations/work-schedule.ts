import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const time = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isWorkDay: z.boolean(),
  startTime: z.string().regex(time).optional(),
  endTime: z.string().regex(time).optional(),
  breakStartTime: z.string().regex(time).optional(),
  breakEndTime: z.string().regex(time).optional(),
  toleranceMinutes: z.number().int().min(0).max(120),
}).superRefine((day, context) => {
  if (!day.isWorkDay) return;
  if (!day.startTime || !day.endTime) context.addIssue({ code: "custom", message: "Informe entrada e saída.", path: ["startTime"] });
  if (day.startTime && day.endTime && day.startTime >= day.endTime) context.addIssue({ code: "custom", message: "A saída deve ser posterior à entrada.", path: ["endTime"] });
  const hasOneBreak = Boolean(day.breakStartTime) !== Boolean(day.breakEndTime);
  if (hasOneBreak) context.addIssue({ code: "custom", message: "Informe o início e o fim do intervalo.", path: ["breakStartTime"] });
  if (day.breakStartTime && day.breakEndTime && (day.breakStartTime >= day.breakEndTime || day.breakStartTime <= (day.startTime ?? "") || day.breakEndTime >= (day.endTime ?? ""))) context.addIssue({ code: "custom", message: "O intervalo deve estar dentro da jornada.", path: ["breakStartTime"] });
});

export const workScheduleCreateSchema = z.object({
  employeeId: z.uuid(),
  name: z.string().trim().min(3).max(100),
  validFrom: z.string().regex(isoDate, "Informe a data inicial."),
  validTo: z.string().regex(isoDate, "Informe uma data final válida.").optional(),
  days: z.array(scheduleDaySchema).length(7),
}).superRefine((schedule, context) => {
  if (schedule.validTo && schedule.validTo < schedule.validFrom) context.addIssue({ code: "custom", message: "A data final deve ser posterior à inicial.", path: ["validTo"] });
  if (!schedule.days.some((day) => day.isWorkDay)) context.addIssue({ code: "custom", message: "Selecione ao menos um dia de trabalho.", path: ["days"] });
  if (new Set(schedule.days.map((day) => day.dayOfWeek)).size !== 7) context.addIssue({ code: "custom", message: "Os sete dias devem ser informados.", path: ["days"] });
});

export type WorkScheduleCreateInput = z.infer<typeof workScheduleCreateSchema>;
