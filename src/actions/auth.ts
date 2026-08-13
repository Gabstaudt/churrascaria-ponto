"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { db } from "@/db";
import { authAuditLogs } from "@/db/schema";

export async function logoutAction() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session) await db.insert(authAuditLogs).values({ action: "LOGOUT", userId: session.user.id, userAgent: requestHeaders.get("user-agent") });
  await auth.api.signOut({ headers: requestHeaders });
  redirect("/login");
}
