CREATE TABLE "certificate_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias" varchar(100) NOT NULL,
	"certificate_type" varchar(20) NOT NULL,
	"serial_number" varchar(200) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"issuer" varchar(500) NOT NULL,
	"fingerprint" varchar(95) NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type" varchar(30) NOT NULL,
	"document_id" uuid NOT NULL,
	"signature_type" varchar(10) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"certificate_serial_number" varchar(200),
	"certificate_subject" varchar(500),
	"input_hash" varchar(64) NOT NULL,
	"output_hash" varchar(64),
	"signature_file_key" varchar(500),
	"provider" varchar(100),
	"implementation_version" varchar(40) NOT NULL,
	"software_version" varchar(40) NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone,
	"last_error_code" varchar(80),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aej_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"closing_period_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"layout_version" varchar(40) NOT NULL,
	"status" varchar(30) DEFAULT 'GENERATED' NOT NULL,
	"file_name" varchar(250) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"signature_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"signature_file_key" varchar(500),
	"signature_hash" varchar(64),
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_by" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_mirror_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"closing_period_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"layout_version" varchar(40) NOT NULL,
	"document_kind" varchar(40) DEFAULT 'OFFICIAL_POINT_MIRROR' NOT NULL,
	"status" varchar(30) DEFAULT 'AVAILABLE' NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"generated_by" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_receipts" ALTER COLUMN "signature_status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "point_receipts" ADD COLUMN "unsigned_pdf_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "afd_generations" ADD COLUMN "signature_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "aej_generations" ADD CONSTRAINT "aej_generations_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aej_generations" ADD CONSTRAINT "aej_generations_closing_period_id_closing_periods_id_fk" FOREIGN KEY ("closing_period_id") REFERENCES "public"."closing_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aej_generations" ADD CONSTRAINT "aej_generations_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_mirror_generations" ADD CONSTRAINT "point_mirror_generations_closing_period_id_closing_periods_id_fk" FOREIGN KEY ("closing_period_id") REFERENCES "public"."closing_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_mirror_generations" ADD CONSTRAINT "point_mirror_generations_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_metadata_serial_unique" ON "certificate_metadata" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "certificate_metadata_status_idx" ON "certificate_metadata" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "signature_operations_idempotency_unique" ON "signature_operations" USING btree ("document_type","document_id","signature_type","input_hash","certificate_serial_number");--> statement-breakpoint
CREATE INDEX "signature_operations_document_idx" ON "signature_operations" USING btree ("document_type","document_id");--> statement-breakpoint
CREATE INDEX "signature_operations_status_retry_idx" ON "signature_operations" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "aej_generations_period_revision_unique" ON "aej_generations" USING btree ("closing_period_id","revision");--> statement-breakpoint
CREATE INDEX "aej_generations_status_idx" ON "aej_generations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "point_mirror_period_revision_unique" ON "point_mirror_generations" USING btree ("closing_period_id","revision");--> statement-breakpoint
CREATE INDEX "point_mirror_status_idx" ON "point_mirror_generations" USING btree ("status");