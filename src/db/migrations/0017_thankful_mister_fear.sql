CREATE TABLE "legal_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_key" varchar(30) DEFAULT 'PRIMARY' NOT NULL,
	"employer_name" varchar(150) NOT NULL,
	"employer_id_type" varchar(3) NOT NULL,
	"employer_id" varchar(14) NOT NULL,
	"caepf" varchar(14),
	"cno" varchar(12),
	"street" varchar(200) NOT NULL,
	"district" varchar(100) NOT NULL,
	"postal_code" varchar(8) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"legal_representative" varchar(150) NOT NULL,
	"employer_email" varchar(255) NOT NULL,
	"ptrp_name" varchar(150) NOT NULL,
	"ptrp_version" varchar(8) NOT NULL,
	"developer_id_type" varchar(3) NOT NULL,
	"developer_id" varchar(14) NOT NULL,
	"developer_name" varchar(150) NOT NULL,
	"developer_email" varchar(50) NOT NULL,
	"official_exports_enabled" boolean DEFAULT false NOT NULL,
	"compliance_reviewed_at" timestamp with time zone,
	"compliance_reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_settings" ADD CONSTRAINT "legal_settings_compliance_reviewed_by_users_id_fk" FOREIGN KEY ("compliance_reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_settings_installation_unique" ON "legal_settings" USING btree ("installation_key");