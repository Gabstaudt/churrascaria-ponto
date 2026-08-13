import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session || session.user.isActive !== true) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/acesso-negado");
  return session;
}

export async function requireEmployeePortal() {
  const session = await requireSession();
  if (session.user.role !== "EMPLOYEE" || !session.user.employeeId) redirect("/acesso-negado");
  return { ...session, employeeId: session.user.employeeId };
}

export async function requireManagerPortal() {
  const session = await requireSession();
  if (session.user.role !== "MANAGER") redirect("/acesso-negado");
  return session;
}
