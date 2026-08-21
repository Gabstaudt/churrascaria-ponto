CREATE TABLE "employee_incomplete_punch_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_incomplete_punch_alerts" ADD CONSTRAINT "employee_incomplete_punch_alerts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employee_incomplete_punch_alerts_unique" ON "employee_incomplete_punch_alerts" USING btree ("employee_id","date");