import { z } from "zod";

export const portalUserSchema = z.object({ name: z.string().trim().min(3).max(150), email: z.string().trim().email().toLowerCase(), password: z.string().min(12).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/), role: z.enum(["EMPLOYEE", "MANAGER"]), employeeId: z.string().uuid().optional() }).superRefine((data, ctx) => { if (data.role === "EMPLOYEE" && !data.employeeId) ctx.addIssue({ code: "custom", path: ["employeeId"], message: "Selecione o funcionário." }); });
export const managerScopeSchema = z.object({ managerUserId: z.string().uuid(), employeeId: z.string().uuid() });
