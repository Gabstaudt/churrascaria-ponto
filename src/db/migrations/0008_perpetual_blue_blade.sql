CREATE TYPE "public"."time_adjustment_type" AS ENUM('ADD_ENTRY', 'IGNORE_ENTRY', 'FORGOTTEN_EXIT', 'JUSTIFY_LATE', 'JUSTIFY_EARLY_EXIT');--> statement-breakpoint
CREATE TABLE "time_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" time_adjustment_type NOT NULL,
	"adjusted_at" timestamp with time zone,
	"original_time_entry_id" uuid,
	"reason" text NOT NULL,
	"performed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_adjustments" ADD CONSTRAINT "time_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_adjustments" ADD CONSTRAINT "time_adjustments_original_time_entry_id_time_entries_id_fk" FOREIGN KEY ("original_time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_adjustments" ADD CONSTRAINT "time_adjustments_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_adjustments_employee_date_idx" ON "time_adjustments" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "time_adjustments_original_entry_idx" ON "time_adjustments" USING btree ("original_time_entry_id");--> statement-breakpoint
CREATE INDEX "time_adjustments_created_idx" ON "time_adjustments" USING btree ("created_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_time_adjustment_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'time_adjustments are append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER time_adjustments_prevent_update_delete
BEFORE UPDATE OR DELETE ON "time_adjustments"
FOR EACH ROW EXECUTE FUNCTION prevent_time_adjustment_mutation();
