import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums";
import { employees } from "./employees";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    employeeId: uuid("employee_id").unique().references(() => employees.id, { onDelete: "restrict" }),
    role: userRoleEnum("role").notNull().default("EMPLOYEE"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("users_role_idx").on(table.role), index("users_employee_idx").on(table.employeeId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
