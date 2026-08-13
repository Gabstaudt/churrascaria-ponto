CREATE TYPE "public"."time_bank_entry_type" AS ENUM('DAILY_CALCULATION', 'RECALCULATION', 'MANUAL_ADJUSTMENT');--> statement-breakpoint
CREATE TABLE "time_bank_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"reference_date" date NOT NULL,
	"type" time_bank_entry_type NOT NULL,
	"amount_minutes" integer NOT NULL,
	"calculated_daily_minutes" integer,
	"calculation_version" varchar(50),
	"source_fingerprint" varchar(64),
	"policy_id" uuid,
	"reason" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_bank_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"effective_from" date NOT NULL,
	"credit_basis_points" integer DEFAULT 10000 NOT NULL,
	"debit_basis_points" integer DEFAULT 10000 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_bank_entries" ADD CONSTRAINT "time_bank_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_bank_entries" ADD CONSTRAINT "time_bank_entries_policy_id_time_bank_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."time_bank_policies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_bank_entries" ADD CONSTRAINT "time_bank_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_bank_policies" ADD CONSTRAINT "time_bank_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_bank_entries_employee_date_idx" ON "time_bank_entries" USING btree ("employee_id","reference_date");--> statement-breakpoint
CREATE INDEX "time_bank_entries_created_idx" ON "time_bank_entries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "time_bank_entries_source_unique" ON "time_bank_entries" USING btree ("employee_id","reference_date","source_fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "time_bank_policies_effective_unique" ON "time_bank_policies" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "time_bank_policies_effective_idx" ON "time_bank_policies" USING btree ("effective_from");