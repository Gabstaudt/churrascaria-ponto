import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { TerminalApp } from "@/components/terminal/terminal-app";
import { minimalEmployeeName } from "@/terminal/privacy";
import { developmentSimulationEnabled } from "@/terminal/development-mode";

export default async function PointTerminalPage() { const developmentEmployees = developmentSimulationEnabled(process.env.NODE_ENV) ? await db.select({ id: employees.id, displayName: employees.fullName, jobTitle: employees.jobTitle }).from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName)) : []; return <TerminalApp developmentEmployees={developmentEmployees.map((employee) => ({ ...employee, displayName: minimalEmployeeName(employee.displayName), jobTitle: employee.jobTitle ?? undefined }))} />; }
