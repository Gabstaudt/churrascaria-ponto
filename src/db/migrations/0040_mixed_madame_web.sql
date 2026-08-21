CREATE TABLE "scheduled_overtime_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"tolerance_minutes" integer DEFAULT 10 NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_overtime_periods" ADD CONSTRAINT "scheduled_overtime_periods_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_overtime_periods" ADD CONSTRAINT "scheduled_overtime_periods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_overtime_periods_employee_date_seq_unique" ON "scheduled_overtime_periods" USING btree ("employee_id","date","sequence");--> statement-breakpoint
CREATE INDEX "scheduled_overtime_periods_date_idx" ON "scheduled_overtime_periods" USING btree ("date");