CREATE TABLE "point_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_entry_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"registrar_id" uuid NOT NULL,
	"collector_id" uuid NOT NULL,
	"nsr" varchar(30) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"format_version" varchar(40) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"generated_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"pdf_file_key" varchar(500),
	"pdf_hash" varchar(64),
	"signature_status" varchar(30) DEFAULT 'NOT_REQUIRED' NOT NULL,
	"signature_provider" varchar(100),
	"certificate_identifier" varchar(200),
	"certificate_subject" varchar(300),
	"certificate_valid_from" timestamp with time zone,
	"certificate_valid_until" timestamp with time zone,
	"public_verification_token_hash" varchar(64) NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" varchar(80),
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_receipts" ADD CONSTRAINT "point_receipts_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_receipts" ADD CONSTRAINT "point_receipts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_receipts" ADD CONSTRAINT "point_receipts_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_receipts" ADD CONSTRAINT "point_receipts_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_receipts" ADD CONSTRAINT "point_receipts_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "point_receipts_entry_version_unique" ON "point_receipts" USING btree ("time_entry_id","format_version");--> statement-breakpoint
CREATE UNIQUE INDEX "point_receipts_number_unique" ON "point_receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "point_receipts_verification_token_unique" ON "point_receipts" USING btree ("public_verification_token_hash");--> statement-breakpoint
CREATE INDEX "point_receipts_employee_time_idx" ON "point_receipts" USING btree ("employee_id","recorded_at");--> statement-breakpoint
CREATE INDEX "point_receipts_status_retry_idx" ON "point_receipts" USING btree ("status","next_retry_at");