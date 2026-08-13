import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleValues = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;

export const employeeStatusValues = [
  "ACTIVE",
  "VACATION",
  "LEAVE",
  "TERMINATED",
  "INACTIVE",
] as const;

export const scheduleExceptionTypeValues = ["WORK", "OFF"] as const;
export type ScheduleExceptionType = (typeof scheduleExceptionTypeValues)[number];

export type EmployeeStatus = (typeof employeeStatusValues)[number];

export const userRoleEnum = pgEnum("user_role", userRoleValues);
export const employeeStatusEnum = pgEnum(
  "employee_status",
  employeeStatusValues,
);
export const scheduleExceptionTypeEnum = pgEnum("schedule_exception_type", scheduleExceptionTypeValues);
