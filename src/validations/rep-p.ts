import { z } from "zod";

export const establishmentSchema = z.object({ name: z.string().trim().min(2).max(150), cnpj: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().length(14)), timezone: z.literal("America/Belem").default("America/Belem") }).strict();
