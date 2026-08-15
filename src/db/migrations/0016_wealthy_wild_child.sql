CREATE TABLE "rep_alert_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rep_device_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"occurrence_count" integer DEFAULT 0 NOT NULL,
	"details" jsonb,
	"first_detected_at" timestamp with time zone,
	"last_detected_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_reconciliation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rep_device_id" uuid NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"source_count" integer NOT NULL,
	"matched_count" integer NOT NULL,
	"missing_count" integer NOT NULL,
	"altered_count" integer NOT NULL,
	"extra_count" integer NOT NULL,
	"missing_nsrs" jsonb NOT NULL,
	"altered_nsrs" jsonb NOT NULL,
	"extra_nsrs" jsonb NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rep_alert_states" ADD CONSTRAINT "rep_alert_states_rep_device_id_rep_devices_id_fk" FOREIGN KEY ("rep_device_id") REFERENCES "public"."rep_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_reconciliation_runs" ADD CONSTRAINT "rep_reconciliation_runs_rep_device_id_rep_devices_id_fk" FOREIGN KEY ("rep_device_id") REFERENCES "public"."rep_devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_reconciliation_runs" ADD CONSTRAINT "rep_reconciliation_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rep_alert_states_device_type_unique" ON "rep_alert_states" USING btree ("rep_device_id","type");--> statement-breakpoint
CREATE INDEX "rep_alert_states_active_idx" ON "rep_alert_states" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rep_reconciliation_device_created_idx" ON "rep_reconciliation_runs" USING btree ("rep_device_id","created_at");