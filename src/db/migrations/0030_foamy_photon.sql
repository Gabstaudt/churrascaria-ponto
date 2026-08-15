CREATE TABLE "contingency_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"collector_id" uuid NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"failure_type" varchar(30) NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"decision_reason" varchar(500),
	"time_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD CONSTRAINT "contingency_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD CONSTRAINT "contingency_requests_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contingency_requests" ADD CONSTRAINT "contingency_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contingency_requests_status_time_idx" ON "contingency_requests" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "contingency_requests_employee_time_idx" ON "contingency_requests" USING btree ("employee_id","requested_at");