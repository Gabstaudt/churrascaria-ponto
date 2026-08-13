"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { saveScheduleException } from "@/services/schedule-calendar.service";
import { scheduleExceptionSchema } from "@/validations/schedule-exception";

export type ExceptionFormState = { message?: string; errors?: string[] };

export async function saveScheduleExceptionAction(_state: ExceptionFormState, formData: FormData): Promise<ExceptionFormState> {
  const session = await requireAdmin();
  const optional = (name: string) => String(formData.get(name) ?? "").trim() || undefined;
  const parsed = scheduleExceptionSchema.safeParse({ employeeId: formData.get("employeeId"), date: formData.get("date"), type: formData.get("type"), startTime: optional("startTime"), endTime: optional("endTime"), breakStartTime: optional("breakStartTime"), breakEndTime: optional("breakEndTime"), toleranceMinutes: formData.get("toleranceMinutes") || 0, reason: formData.get("reason") });
  if (!parsed.success) return { message: "Revise os dados do ajuste.", errors: parsed.error.issues.map((issue) => issue.message) };
  try {
    await saveScheduleException(parsed.data, session.user.id);
    redirect(`/admin/escalas?date=${parsed.data.date}&view=day&saved=1`);
  } catch (error) {
    console.error("Falha ao salvar exceção da escala", { error: error instanceof Error ? error.message : "unknown", performedBy: session.user.id });
    return { message: "Não foi possível salvar o ajuste excepcional." };
  }
}
