CREATE TYPE "public"."time_entry_source" AS ENUM('SIMULATOR', 'IMPORT', 'REP_C');--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"source" time_entry_source NOT NULL,
	"external_id" varchar(150) NOT NULL,
	"device_identifier" varchar(150),
	"metadata" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_source_external_unique" ON "time_entries" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "time_entries_employee_occurred_idx" ON "time_entries" USING btree ("employee_id","occurred_at");--> statement-breakpoint
CREATE INDEX "time_entries_occurred_idx" ON "time_entries" USING btree ("occurred_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_time_entry_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'time_entries are immutable';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER time_entries_prevent_update_delete
BEFORE UPDATE OR DELETE ON "time_entries"
FOR EACH ROW EXECUTE FUNCTION prevent_time_entry_mutation();
