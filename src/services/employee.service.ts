import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, employeeDocuments, employees, users, type EmployeeStatus } from "@/db/schema";
import type { EmployeeCreateInput, EmployeeUpdateInput } from "@/validations/employee";

import { mapEmployeeConflict } from "./employee-errors";
import { isEmployeeActiveForStatus, resolveEmployeeActivation } from "./employee-status";
import { recordAudit } from "./audit.service";
import { redactAuditPayload } from "./audit-redaction";

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

      await recordAudit(tx, {
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

export async function getEmployeeById(id: string) {
  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return employee;
}

export async function listEmployeeDocuments(id: string) {
  return db.select({ id: employeeDocuments.id, title: employeeDocuments.title, type: employeeDocuments.type, fileName: employeeDocuments.fileName, contentType: employeeDocuments.contentType, createdAt: employeeDocuments.createdAt })
    .from(employeeDocuments).where(eq(employeeDocuments.employeeId, id)).orderBy(desc(employeeDocuments.createdAt));
}

export async function getEmployeeAuditHistory(id: string) {
  const history = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      before: auditLogs.before,
      after: auditLogs.after,
      reason: auditLogs.reason,
      createdAt: auditLogs.createdAt,
      performedByName: users.name,
    })
    .from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.performedBy))
    .where(and(eq(auditLogs.entity, "Employee"), eq(auditLogs.entityId, id)))
    .orderBy(desc(auditLogs.createdAt));
  return history.map((item) => ({ ...item, before: redactAuditPayload(item.before), after: redactAuditPayload(item.after) }));
}

function auditSnapshot(employee: typeof employees.$inferSelect) {
  return {
    id: employee.id,
    fullName: employee.fullName,
    cpf: employee.cpf,
    phone: employee.phone,
    position: employee.position,
    registrationNumber: employee.registrationNumber,
    admissionDate: employee.admissionDate,
    status: employee.status,
    isActive: employee.isActive,
    workCardNumber: employee.workCardNumber,
    emergencyContactName: employee.emergencyContactName,
    emergencyContactRelationship: employee.emergencyContactRelationship,
    emergencyContactPhone: employee.emergencyContactPhone,
  };
}

export async function updateEmployee(id: string, input: EmployeeUpdateInput, performedBy: string) {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx.select().from(employees).where(eq(employees.id, id)).limit(1);
      if (!current) return undefined;

      const isActive = isEmployeeActiveForStatus(input.status);
      const [updated] = await tx
        .update(employees)
        .set({ ...input, isActive, updatedAt: new Date() })
        .where(eq(employees.id, id))
        .returning();
      if (!updated) throw new Error("Não foi possível atualizar o funcionário.");

      await recordAudit(tx, {
        action: "UPDATE_EMPLOYEE",
        entity: "Employee",
        entityId: id,
        performedBy,
        before: auditSnapshot(current),
        after: auditSnapshot(updated),
      });
      return updated;
    });
  } catch (error) {
    const conflict = mapEmployeeConflict(error);
    if (conflict) throw conflict;
    throw error;
  }
}

export async function setEmployeeActive(id: string, active: boolean, performedBy: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!current) return undefined;
    const activation = resolveEmployeeActivation(active);
    const [updated] = await tx
      .update(employees)
      .set({ ...activation, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    if (!updated) throw new Error("Não foi possível alterar o funcionário.");
    await recordAudit(tx, {
      action: active ? "REACTIVATE_EMPLOYEE" : "DEACTIVATE_EMPLOYEE",
      entity: "Employee",
      entityId: id,
      performedBy,
      before: auditSnapshot(current),
      after: auditSnapshot(updated),
      reason: active ? "Reativação administrativa" : "Inativação administrativa",
    });
    return updated;
  });
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
