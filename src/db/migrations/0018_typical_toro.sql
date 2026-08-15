CREATE TYPE "public"."rep_mode" AS ENUM('REP_C', 'REP_P');--> statement-breakpoint
CREATE TYPE "public"."rep_registrar_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'BLOCKED');--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registrar_id" uuid NOT NULL,
	"official_timezone" varchar(50) DEFAULT 'America/Belem' NOT NULL,
	"registration_enabled" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rep_registrars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"mode" "rep_mode" NOT NULL,
	"status" "rep_registrar_status" DEFAULT 'DRAFT' NOT NULL,
	"identifier" varchar(100) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rep_configurations" ADD CONSTRAINT "rep_configurations_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_registrars" ADD CONSTRAINT "rep_registrars_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_registrars" ADD CONSTRAINT "rep_registrars_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rep_configurations_registrar_unique" ON "rep_configurations" USING btree ("registrar_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rep_registrars_identifier_unique" ON "rep_registrars" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "rep_registrars_establishment_idx" ON "rep_registrars" USING btree ("establishment_id");