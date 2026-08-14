CREATE TYPE "public"."rep_sync_status" AS ENUM('RECEIVED', 'PROCESSED', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TABLE "rep_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"manufacturer" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"adapter" varchar(50) DEFAULT 'MOCK' NOT NULL,
	"credential_hash" varchar(64) NOT NULL,
	"credential_prefix" varchar(12) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_nsr" varchar(30),
	"last_seen_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rep_devices_serial_number_unique" UNIQUE("serial_number"),
	CONSTRAINT "rep_devices_credential_hash_unique" UNIQUE("credential_hash")
);
--> statement-breakpoint
CREATE TABLE "rep_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rep_device_id" uuid NOT NULL,
	"request_id" varchar(100) NOT NULL,
	"status" "rep_sync_status" DEFAULT 'RECEIVED' NOT NULL,
	"received_count" integer DEFAULT 0 NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"error_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rep_time_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rep_device_id" uuid NOT NULL,
	"nsr" varchar(30) NOT NULL,
	"time_entry_id" uuid NOT NULL,
	"raw_fingerprint" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rep_time_records_time_entry_id_unique" UNIQUE("time_entry_id")
);
--> statement-breakpoint
ALTER TABLE "rep_devices" ADD CONSTRAINT "rep_devices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_sync_logs" ADD CONSTRAINT "rep_sync_logs_rep_device_id_rep_devices_id_fk" FOREIGN KEY ("rep_device_id") REFERENCES "public"."rep_devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_time_records" ADD CONSTRAINT "rep_time_records_rep_device_id_rep_devices_id_fk" FOREIGN KEY ("rep_device_id") REFERENCES "public"."rep_devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_time_records" ADD CONSTRAINT "rep_time_records_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rep_devices_active_idx" ON "rep_devices" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "rep_sync_logs_device_request_unique" ON "rep_sync_logs" USING btree ("rep_device_id","request_id");--> statement-breakpoint
CREATE INDEX "rep_sync_logs_device_created_idx" ON "rep_sync_logs" USING btree ("rep_device_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rep_time_records_device_nsr_unique" ON "rep_time_records" USING btree ("rep_device_id","nsr");--> statement-breakpoint
CREATE INDEX "rep_time_records_device_idx" ON "rep_time_records" USING btree ("rep_device_id");