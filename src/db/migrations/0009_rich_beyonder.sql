CREATE TYPE "public"."absence_decision" AS ENUM('UNJUSTIFIED', 'JUSTIFIED', 'MEDICAL_CERTIFICATE', 'DAY_OFF', 'VACATION', 'LEAVE', 'TIME_ENTRY_ERROR', 'OTHER');--> statement-breakpoint
CREATE TABLE "absence_justifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"absence_id" uuid NOT NULL,
	"decision" "absence_decision" NOT NULL,
	"reason" text NOT NULL,
	"approved_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"decision" "absence_decision" NOT NULL,
	"decided_by" uuid NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absence_justifications" ADD CONSTRAINT "absence_justifications_absence_id_absences_id_fk" FOREIGN KEY ("absence_id") REFERENCES "public"."absences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_justifications" ADD CONSTRAINT "absence_justifications_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "absence_justifications_absence_idx" ON "absence_justifications" USING btree ("absence_id");--> statement-breakpoint
CREATE INDEX "absence_justifications_created_idx" ON "absence_justifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "absences_employee_date_unique" ON "absences" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "absences_date_idx" ON "absences" USING btree ("date");--> statement-breakpoint
CREATE INDEX "absences_decision_idx" ON "absences" USING btree ("decision");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_absence_justification_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'absence_justifications are append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER absence_justifications_prevent_update_delete
BEFORE UPDATE OR DELETE ON "absence_justifications"
FOR EACH ROW EXECUTE FUNCTION prevent_absence_justification_mutation();
