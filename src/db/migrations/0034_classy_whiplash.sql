CREATE TABLE "afd_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registrar_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"layout_version" varchar(40) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"record_count_by_type" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_nsr" varchar(9),
	"last_nsr" varchar(9),
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_name" varchar(250),
	"file_key" varchar(500),
	"file_hash" varchar(64),
	"signature_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"signature_file_key" varchar(500),
	"certificate_identifier" varchar(200),
	"signed_at" timestamp with time zone,
	"generated_by" uuid NOT NULL,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "afd_generations" ADD CONSTRAINT "afd_generations_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afd_generations" ADD CONSTRAINT "afd_generations_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "afd_generations" ADD CONSTRAINT "afd_generations_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "afd_generations_registrar_period_idx" ON "afd_generations" USING btree ("registrar_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "afd_generations_establishment_created_idx" ON "afd_generations" USING btree ("establishment_id","created_at");--> statement-breakpoint
CREATE INDEX "afd_generations_status_idx" ON "afd_generations" USING btree ("status");