import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const time = /^([01]\d|2[0-3]):[0-5]\d$/;

export const simulatedTimeEntriesSchema = z.object({
  employeeId: z.uuid("Selecione um funcionário."),
  date: z.string().regex(isoDate, "Informe uma data válida."),
  times: z.array(z.string().regex(time, "Informe horários válidos.")).min(1, "Informe ao menos uma marcação.").max(8, "Informe no máximo oito marcações.")
    .refine((items) => new Set(items).size === items.length, "Não repita horários na mesma data."),
});

export type SimulatedTimeEntriesInput = z.infer<typeof simulatedTimeEntriesSchema>;
