import { z } from "zod";
import { dailyStatusValues } from "@/services/report-core";

export const reportFiltersSchema = z.object({ startDate: z.iso.date(), endDate: z.iso.date(), employeeId: z.string().uuid().optional(), status: z.enum(dailyStatusValues).optional() }).superRefine((data, ctx) => { const start = new Date(`${data.startDate}T00:00:00Z`); const end = new Date(`${data.endDate}T00:00:00Z`); const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1; if (days < 1) ctx.addIssue({ code: "custom", path: ["endDate"], message: "A data final deve ser posterior à inicial." }); if (days > 366) ctx.addIssue({ code: "custom", path: ["endDate"], message: "O período máximo é de 366 dias." }); });
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
