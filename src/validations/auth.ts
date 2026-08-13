import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um email válido.")),
  password: z.string().min(1, "Informe sua senha.").max(128),
});

export const createAdminSchema = z.object({
  name: z.string().trim().min(3).max(150),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/),
});
