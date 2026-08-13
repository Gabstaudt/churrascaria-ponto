CREATE TABLE "medical_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"absence_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"description" varchar(300),
	"file_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_until" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medical_certificates_file_key_unique" UNIQUE("file_key")
);
--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_absence_id_absences_id_fk" FOREIGN KEY ("absence_id") REFERENCES "public"."absences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medical_certificates_employee_idx" ON "medical_certificates" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "medical_certificates_absence_idx" ON "medical_certificates" USING btree ("absence_id");--> statement-breakpoint
CREATE INDEX "medical_certificates_period_idx" ON "medical_certificates" USING btree ("start_date","end_date");