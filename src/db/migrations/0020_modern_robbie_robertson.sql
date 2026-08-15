CREATE TYPE "public"."rep_collector_status" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED');--> statement-breakpoint
CREATE TABLE "rep_collectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registrar_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"device_identifier" varchar(150) NOT NULL,
	"status" "rep_collector_status" DEFAULT 'INACTIVE' NOT NULL,
	"credential_hash" varchar(64) NOT NULL,
	"credential_prefix" varchar(12) NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rep_collectors" ADD CONSTRAINT "rep_collectors_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rep_collectors_device_unique" ON "rep_collectors" USING btree ("device_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "rep_collectors_credential_unique" ON "rep_collectors" USING btree ("credential_hash");--> statement-breakpoint
CREATE INDEX "rep_collectors_registrar_idx" ON "rep_collectors" USING btree ("registrar_id");