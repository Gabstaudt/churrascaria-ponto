CREATE TYPE "public"."closing_period_event" AS ENUM('CREATED', 'SENT_TO_REVIEW', 'CLOSED', 'REOPENED');--> statement-breakpoint
CREATE TYPE "public"."closing_period_status" AS ENUM('OPEN', 'IN_REVIEW', 'CLOSED');--> statement-breakpoint
CREATE TABLE "closing_period_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"event" "closing_period_event" NOT NULL,
	"from_status" "closing_period_status",
	"to_status" "closing_period_status" NOT NULL,
	"reason" text,
	"performed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closing_period_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"planned_minutes" integer NOT NULL,
	"worked_minutes" integer NOT NULL,
	"late_minutes" integer NOT NULL,
	"early_departure_minutes" integer NOT NULL,
	"overtime_minutes" integer NOT NULL,
	"absence_days" integer NOT NULL,
	"justified_absence_days" integer NOT NULL,
	"time_bank_minutes" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closing_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_month" varchar(7) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "closing_period_status" DEFAULT 'OPEN' NOT NULL,
	"current_revision" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"closed_by" uuid,
	"closed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "closing_periods_reference_month_unique" UNIQUE("reference_month")
);
--> statement-breakpoint
ALTER TABLE "closing_period_events" ADD CONSTRAINT "closing_period_events_period_id_closing_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."closing_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_period_events" ADD CONSTRAINT "closing_period_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_period_summaries" ADD CONSTRAINT "closing_period_summaries_period_id_closing_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."closing_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_period_summaries" ADD CONSTRAINT "closing_period_summaries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_periods" ADD CONSTRAINT "closing_periods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_periods" ADD CONSTRAINT "closing_periods_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_periods" ADD CONSTRAINT "closing_periods_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "closing_period_events_period_idx" ON "closing_period_events" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "closing_period_events_created_idx" ON "closing_period_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "closing_period_summaries_revision_unique" ON "closing_period_summaries" USING btree ("period_id","employee_id","revision");--> statement-breakpoint
CREATE INDEX "closing_period_summaries_period_idx" ON "closing_period_summaries" USING btree ("period_id","revision");--> statement-breakpoint
CREATE INDEX "closing_periods_status_idx" ON "closing_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "closing_periods_dates_idx" ON "closing_periods" USING btree ("start_date","end_date");