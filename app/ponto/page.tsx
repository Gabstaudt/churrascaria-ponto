import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { TerminalApp } from "@/components/terminal/terminal-app";

export default async function PointTerminalPage() { const developmentEmployees = process.env.NODE_ENV === "development" ? await db.select({ id: employees.id, displayName: employees.fullName, jobTitle: employees.jobTitle }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName)) : []; return <TerminalApp developmentEmployees={developmentEmployees.map((employee) => ({ ...employee, jobTitle: employee.jobTitle ?? undefined }))} />; }
