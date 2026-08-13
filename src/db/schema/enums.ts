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
export const dayOffSwapStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export const leaveTypeValues = ["MEDICAL", "PERSONAL", "LEGAL", "OTHER"] as const;
export const timeEntrySourceValues = ["SIMULATOR", "IMPORT", "REP_C"] as const;
export const timeAdjustmentTypeValues = ["ADD_ENTRY", "IGNORE_ENTRY", "FORGOTTEN_EXIT", "JUSTIFY_LATE", "JUSTIFY_EARLY_EXIT"] as const;
export const absenceDecisionValues = ["UNJUSTIFIED", "JUSTIFIED", "MEDICAL_CERTIFICATE", "DAY_OFF", "VACATION", "LEAVE", "TIME_ENTRY_ERROR", "OTHER"] as const;

export type EmployeeStatus = (typeof employeeStatusValues)[number];

export const userRoleEnum = pgEnum("user_role", userRoleValues);
export const employeeStatusEnum = pgEnum(
  "employee_status",
  employeeStatusValues,
);
export const scheduleExceptionTypeEnum = pgEnum("schedule_exception_type", scheduleExceptionTypeValues);
export const dayOffSwapStatusEnum = pgEnum("day_off_swap_status", dayOffSwapStatusValues);
export const leaveTypeEnum = pgEnum("leave_type", leaveTypeValues);
export const timeEntrySourceEnum = pgEnum("time_entry_source", timeEntrySourceValues);
export const timeAdjustmentTypeEnum = pgEnum("time_adjustment_type", timeAdjustmentTypeValues);
export const absenceDecisionEnum = pgEnum("absence_decision", absenceDecisionValues);
