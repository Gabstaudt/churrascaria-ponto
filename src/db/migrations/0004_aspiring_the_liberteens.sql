CREATE TABLE "schedule_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_schedule_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_work_day" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"break_start_time" time,
	"break_end_time" time,
	"tolerance_minutes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule_days" ADD CONSTRAINT "schedule_days_work_schedule_id_work_schedules_id_fk" FOREIGN KEY ("work_schedule_id") REFERENCES "public"."work_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_days_schedule_weekday_unique" ON "schedule_days" USING btree ("work_schedule_id","day_of_week");--> statement-breakpoint
CREATE INDEX "schedule_days_schedule_id_idx" ON "schedule_days" USING btree ("work_schedule_id");--> statement-breakpoint
CREATE INDEX "work_schedules_employee_id_idx" ON "work_schedules" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "work_schedules_validity_idx" ON "work_schedules" USING btree ("valid_from","valid_to");