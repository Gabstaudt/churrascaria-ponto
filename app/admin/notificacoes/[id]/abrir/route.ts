import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/auth/session";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { markNotificationRead } from "@/services/portal.service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const [notice] = await db.select({ link: notifications.link }).from(notifications).where(and(eq(notifications.id, id), eq(notifications.recipientUserId, session.user.id))).limit(1);
  if (!notice) return Response.redirect(new URL("/admin/notificacoes", request.url));
  await markNotificationRead(id, session.user.id);
  return Response.redirect(new URL(notice.link ?? "/admin/notificacoes", request.url));
}
