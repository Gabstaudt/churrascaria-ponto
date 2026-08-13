import { date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { timeAdjustmentTypeEnum } from "./enums";
import { timeEntries } from "./time-entries";
import { users } from "./users";

export const timeAdjustments = pgTable("time_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  date: date("date", { mode: "string" }).notNull(),
  type: timeAdjustmentTypeEnum("type").notNull(),
  adjustedAt: timestamp("adjusted_at", { withTimezone: true, mode: "date" }),
  originalTimeEntryId: uuid("original_time_entry_id").references(() => timeEntries.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  performedBy: uuid("performed_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [index("time_adjustments_employee_date_idx").on(table.employeeId, table.date), index("time_adjustments_original_entry_idx").on(table.originalTimeEntryId), index("time_adjustments_created_idx").on(table.createdAt)]);

export type TimeAdjustment = typeof timeAdjustments.$inferSelect;
