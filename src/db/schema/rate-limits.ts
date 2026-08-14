import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rateLimitBuckets = pgTable("rate_limit_buckets", { key: text("key").primaryKey(), windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(), count: integer("count").notNull().default(1), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() }, (table) => [index("rate_limit_buckets_updated_idx").on(table.updatedAt)]);
