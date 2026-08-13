import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleValues = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;

export const employeeStatusValues = [
  "ACTIVE",
  "VACATION",
  "LEAVE",
  "TERMINATED",
  "INACTIVE",
] as const;

export const userRoleEnum = pgEnum("user_role", userRoleValues);
export const employeeStatusEnum = pgEnum(
  "employee_status",
  employeeStatusValues,
);
