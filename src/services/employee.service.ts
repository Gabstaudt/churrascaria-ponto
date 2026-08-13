import "server-only";

import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, employees, type EmployeeStatus } from "@/db/schema";
import type { EmployeeCreateInput } from "@/validations/employee";

import { mapEmployeeConflict } from "./employee-errors";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export type EmployeeListInput = {
  query?: string;
  status?: EmployeeStatus;
  page?: number;
  pageSize?: number;
};

export type EmployeeListResult = {
  items: Array<{
    id: string;
    fullName: string;
    cpf: string;
    phone: string | null;
    position: string;
    registrationNumber: string;
    admissionDate: string;
    status: EmployeeStatus;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function createEmployee(input: EmployeeCreateInput, performedBy: string) {
  try {
    return await db.transaction(async (tx) => {
      const [employee] = await tx
        .insert(employees)
        .values(input)
        .returning();

      if (!employee) throw new Error("Não foi possível cadastrar o funcionário.");

      await tx.insert(auditLogs).values({
        action: "CREATE_EMPLOYEE",
        entity: "Employee",
        entityId: employee.id,
        performedBy,
        after: {
          id: employee.id,
          fullName: employee.fullName,
          registrationNumber: employee.registrationNumber,
          position: employee.position,
          admissionDate: employee.admissionDate,
          status: employee.status,
        },
      });

      return employee;
    });
  } catch (error) {
    const conflict = mapEmployeeConflict(error);
    if (conflict) throw conflict;
    throw error;
  }
}

export async function listEmployees(input: EmployeeListInput = {}): Promise<EmployeeListResult> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(input.pageSize ?? DEFAULT_PAGE_SIZE)));
  const query = input.query?.trim();
  const conditions: SQL[] = [];

  if (query) {
    const pattern = `%${query}%`;
    const digits = query.replace(/\D/g, "");
    const searchCondition = or(
      ilike(employees.fullName, pattern),
      ilike(employees.position, pattern),
      ilike(employees.registrationNumber, pattern),
      ...(digits ? [ilike(employees.cpf, `%${digits}%`)] : []),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (input.status) conditions.push(eq(employees.status, input.status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const totalRows = await db.select({ value: count() }).from(employees).where(where);
  const total = totalRows[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const items = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      cpf: employees.cpf,
      phone: employees.phone,
      position: employees.position,
      registrationNumber: employees.registrationNumber,
      admissionDate: employees.admissionDate,
      status: employees.status,
    })
    .from(employees)
    .where(where)
    .orderBy(asc(employees.fullName))
    .limit(pageSize)
    .offset((effectivePage - 1) * pageSize);

  return { items, total, page: effectivePage, pageSize, totalPages };
}
