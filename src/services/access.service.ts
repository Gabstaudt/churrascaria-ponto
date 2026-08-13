import "server-only";
import { hashPassword } from "better-auth/crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, employees, managerEmployees, users } from "@/db/schema";
import { recordAudit } from "./audit.service";

export async function createPortalAccess(input: { name: string; email: string; password: string; role: "EMPLOYEE" | "MANAGER"; employeeId?: string }, performedBy: string) {
  const password = await hashPassword(input.password);
  return db.transaction(async (tx) => { const [user] = await tx.insert(users).values({ name: input.name, email: input.email, emailVerified: true, role: input.role, employeeId: input.role === "EMPLOYEE" ? input.employeeId : null }).returning(); if (!user) throw new Error("Não foi possível criar o acesso."); await tx.insert(accounts).values({ accountId: user.id, providerId: "credential", userId: user.id, password }); await recordAudit(tx, { action: "CREATE_PORTAL_ACCESS", entity: "User", entityId: user.id, performedBy, after: { email: user.email, role: user.role, employeeId: user.employeeId } }); return user; });
}
export async function assignManagerEmployee(managerUserId: string, employeeId: string, performedBy: string) { return db.insert(managerEmployees).values({ managerUserId, employeeId, createdBy: performedBy }).onConflictDoNothing().returning(); }
export async function listAccessManagement() { const [portalUsers, employeeRows, scopes] = await Promise.all([db.select({ id: users.id, name: users.name, email: users.email, role: users.role, employeeId: users.employeeId, isActive: users.isActive }).from(users).where(eq(users.isActive, true)).orderBy(asc(users.name)), db.select({ id: employees.id, fullName: employees.fullName, registrationNumber: employees.registrationNumber }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName)), db.select().from(managerEmployees)]); return { users: portalUsers, employees: employeeRows, scopes }; }
