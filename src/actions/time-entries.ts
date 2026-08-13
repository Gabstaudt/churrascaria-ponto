"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { importSimulatedTimeEntries } from "@/services/time-entry.service";
import { simulatedTimeEntriesSchema } from "@/validations/time-entry";

export type TimeEntryFormState = { message?: string; errors?: string[] };

export async function generateSimulatedTimeEntriesAction(_state: TimeEntryFormState, formData: FormData): Promise<TimeEntryFormState> {
  const session = await requireAdmin();
  const times = formData.getAll("times").map(String).filter(Boolean);
  const parsed = simulatedTimeEntriesSchema.safeParse({ employeeId: formData.get("employeeId"), date: formData.get("date"), times });
  if (!parsed.success) return { message: "Revise os dados da simulação.", errors: parsed.error.issues.map((issue) => issue.message) };
  try {
    const result = await importSimulatedTimeEntries(parsed.data, session.user.id);
    redirect(`/admin/marcacoes?employeeId=${parsed.data.employeeId}&date=${parsed.data.date}&generated=${result.inserted}&ignored=${result.ignored}`);
  } catch (error) {
    console.error("Falha ao gerar marcações simuladas", { error: error instanceof Error ? error.message : "unknown", performedBy: session.user.id });
    return { message: "Não foi possível gerar as marcações." };
  }
}
