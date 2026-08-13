import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    identifier: text("identifier"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_audit_logs_action_idx").on(table.action),
    index("auth_audit_logs_user_id_idx").on(table.userId),
    index("auth_audit_logs_created_at_idx").on(table.createdAt),
  ],
);
