import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { timeEntrySourceEnum } from "./enums";

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  source: timeEntrySourceEnum("source").notNull(),
  externalId: varchar("external_id", { length: 150 }).notNull(),
  deviceIdentifier: varchar("device_identifier", { length: 150 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("time_entries_source_external_unique").on(table.source, table.externalId),
  index("time_entries_employee_occurred_idx").on(table.employeeId, table.occurredAt),
  index("time_entries_occurred_idx").on(table.occurredAt),
]);

export type TimeEntry = typeof timeEntries.$inferSelect;
