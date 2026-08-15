CREATE TABLE "offline_point_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar(100) NOT NULL,
	"collector_id" uuid NOT NULL,
	"employee_id" uuid,
	"contingency_event_id" uuid,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"device_captured_at" timestamp with time zone NOT NULL,
	"received_at_server" timestamp with time zone DEFAULT now() NOT NULL,
	"last_server_time" timestamp with time zone,
	"last_clock_sync_at" timestamp with time zone,
	"clock_offset_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"collector_id" uuid,
	"employee_id" uuid,
	"attempt_id" uuid,
	"metadata_safe" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "contingency_requests" ALTER COLUMN "failure_type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "contingency_event_id" uuid;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "establishment_id" uuid;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "category" varchar(30) DEFAULT 'TECHNICAL_FAILURE' NOT NULL;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "original_flow_status" varchar(40);--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "authorization_method" varchar(40);--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offline_point_operations" ADD CONSTRAINT "offline_point_operations_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_point_operations" ADD CONSTRAINT "offline_point_operations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_point_operations" ADD CONSTRAINT "offline_point_operations_contingency_event_id_contingency_requests_id_fk" FOREIGN KEY ("contingency_event_id") REFERENCES "public"."contingency_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "offline_point_operations_operation_unique" ON "offline_point_operations" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "offline_point_operations_status_time_idx" ON "offline_point_operations" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "security_events_type_time_idx" ON "security_events" USING btree ("type","detected_at");--> statement-breakpoint
CREATE INDEX "security_events_collector_time_idx" ON "security_events" USING btree ("collector_id","detected_at");--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD CONSTRAINT "contingency_requests_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;