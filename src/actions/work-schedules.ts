"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { createWorkSchedule, ScheduleOverlapError, updateWorkSchedule } from "@/services/work-schedule.service";
import { workScheduleCreateSchema } from "@/validations/work-schedule";

export type ScheduleFormState = { message?: string; errors?: string[] };

export async function createWorkScheduleAction(_state: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  const session = await requireAdmin();
  let days: unknown;
  try { days = JSON.parse(String(formData.get("days") ?? "[]")); } catch { return { message: "Os dias da jornada são inválidos." }; }
  const parsed = workScheduleCreateSchema.safeParse({ employeeId: formData.get("employeeId"), name: formData.get("name"), validFrom: formData.get("validFrom"), validTo: formData.get("validTo") || undefined, days });
  if (!parsed.success) return { message: "Revise os dados da jornada.", errors: parsed.error.issues.map((issue) => issue.message) };
  let schedule;
  try {
    schedule = await createWorkSchedule(parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof ScheduleOverlapError) return { message: error.message };
    console.error("Falha ao criar jornada", { error: error instanceof Error ? error.message : "unknown", performedBy: session.user.id });
    return { message: "Não foi possível criar a jornada." };
  }
  if (!schedule) return { message: "Funcionário não encontrado." };
  redirect(`/admin/jornadas/${schedule.id}?created=1`);
}

export async function updateWorkScheduleAction(id: string, _state: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  const session = await requireAdmin();
  let days: unknown;
  try { days = JSON.parse(String(formData.get("days") ?? "[]")); } catch { return { message: "Os dias da jornada são inválidos." }; }
  const parsed = workScheduleCreateSchema.safeParse({ employeeId: formData.get("employeeId"), name: formData.get("name"), validFrom: formData.get("validFrom"), validTo: formData.get("validTo") || undefined, days });
  if (!parsed.success) return { message: "Revise os dados da jornada.", errors: parsed.error.issues.map((issue) => issue.message) };
  let schedule;
  try {
    schedule = await updateWorkSchedule(id, parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof ScheduleOverlapError) return { message: error.message };
    console.error("Falha ao atualizar jornada", { error: error instanceof Error ? error.message : "unknown", performedBy: session.user.id });
    return { message: "Não foi possível atualizar a jornada." };
  }
  if (!schedule) return { message: "Jornada não encontrada." };
  redirect(`/admin/jornadas/${schedule.id}?updated=1`);
}
