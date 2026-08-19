"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { markNotificationRead } from "@/services/portal.service";

export async function markAdminNotificationReadAction(id: string) {
  const session = await requireAdmin();
  await markNotificationRead(id, session.user.id);
  redirect("/admin/notificacoes");
}
