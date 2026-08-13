import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { employeeStatusEnum } from "./enums";

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    cpf: varchar("cpf", { length: 11 }).notNull().unique(),
    phone: varchar("phone", { length: 15 }),
    position: varchar("position", { length: 100 }).notNull(),
    registrationNumber: varchar("registration_number", { length: 50 })
      .notNull()
      .unique(),
    admissionDate: date("admission_date", { mode: "string" }).notNull(),
    status: employeeStatusEnum("status").notNull().default("ACTIVE"),
    photoUrl: varchar("photo_url", { length: 2048 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("employees_full_name_idx").on(table.fullName),
    index("employees_status_idx").on(table.status),
  ],
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
