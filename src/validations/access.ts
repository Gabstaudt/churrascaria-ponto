import { z } from "zod";

export const portalUserSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres.").max(150),
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase(),
  password: z.string().min(12, "A senha deve possuir pelo menos 12 caracteres.").max(128).regex(/[a-z]/, "Inclua uma letra minúscula.").regex(/[A-Z]/, "Inclua uma letra maiúscula.").regex(/[0-9]/, "Inclua um número.").regex(/[^A-Za-z0-9]/, "Inclua um símbolo."),
  role: z.enum(["EMPLOYEE", "MANAGER"]),
  employeeId: z.string().uuid().optional(),
}).superRefine((data, ctx) => { if (data.role === "EMPLOYEE" && !data.employeeId) ctx.addIssue({ code: "custom", path: ["employeeId"], message: "Selecione o funcionário que será vinculado ao acesso." }); });
export const managerScopeSchema = z.object({ managerUserId: z.string().uuid(), employeeId: z.string().uuid() });
