import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id").notNull(),
    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entity, table.entityId),
    index("audit_logs_performed_by_idx").on(table.performedBy),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
