CREATE TABLE "biometric_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biometric_profile_id" uuid NOT NULL,
	"encrypted_template" varchar(16000) NOT NULL,
	"encryption_version" varchar(30) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"algorithm_version" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "biometric_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"employee_id" uuid,
	"collector_id" uuid NOT NULL,
	"method" varchar(30) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"liveness_status" varchar(30) NOT NULL,
	"liveness_score" numeric(8, 6),
	"match_status" varchar(30) NOT NULL,
	"similarity_score" numeric(8, 6),
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_biometric_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"template_version" varchar(30) NOT NULL,
	"algorithm_version" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"privacy_notice_version" varchar(30) NOT NULL,
	"policy_version" varchar(30) NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"enrolled_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_registration_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collector_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"location_validation_id" uuid,
	"biometric_validation_id" uuid,
	"status" varchar(30) DEFAULT 'STARTED' NOT NULL,
	"failure_reason" varchar(100),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "biometric_validation_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "registration_attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "biometric_templates" ADD CONSTRAINT "biometric_templates_biometric_profile_id_employee_biometric_profiles_id_fk" FOREIGN KEY ("biometric_profile_id") REFERENCES "public"."employee_biometric_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_validations" ADD CONSTRAINT "biometric_validations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_validations" ADD CONSTRAINT "biometric_validations_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_biometric_profiles" ADD CONSTRAINT "employee_biometric_profiles_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_biometric_profiles" ADD CONSTRAINT "employee_biometric_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_registration_attempts" ADD CONSTRAINT "point_registration_attempts_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_registration_attempts" ADD CONSTRAINT "point_registration_attempts_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "biometric_templates_profile_idx" ON "biometric_templates" USING btree ("biometric_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "biometric_validations_collector_time_idx" ON "biometric_validations" USING btree ("collector_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "biometric_validations_attempt_unique" ON "biometric_validations" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_biometric_profiles_employee_unique" ON "employee_biometric_profiles" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_biometric_profiles_status_idx" ON "employee_biometric_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "point_registration_attempts_collector_time_idx" ON "point_registration_attempts" USING btree ("collector_id","started_at");