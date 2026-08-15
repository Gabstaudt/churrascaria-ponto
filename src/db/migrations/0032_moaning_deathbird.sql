ALTER TABLE "rep_collectors" ADD COLUMN "active_instance_id" varchar(100);--> statement-breakpoint
ALTER TABLE "rep_collectors" ADD COLUMN "active_instance_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rep_collectors" ADD COLUMN "pending_operation_count" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rep_collectors" ADD COLUMN "offline_since" timestamp with time zone;