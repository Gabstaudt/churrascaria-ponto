CREATE TYPE "public"."schedule_exception_type" AS ENUM('WORK', 'OFF');--> statement-breakpoint
CREATE TABLE "schedule_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "schedule_exception_type" NOT NULL,
	"start_time" time,
	"end_time" time,
	"break_start_time" time,
	"break_end_time" time,
	"tolerance_minutes" integer DEFAULT 0 NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_exceptions_employee_date_unique" ON "schedule_exceptions" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "schedule_exceptions_date_idx" ON "schedule_exceptions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "schedule_exceptions_employee_idx" ON "schedule_exceptions" USING btree ("employee_id");