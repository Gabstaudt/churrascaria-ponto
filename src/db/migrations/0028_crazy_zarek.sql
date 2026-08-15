CREATE TABLE "geofence_policy_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"reason" varchar(500) NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collector_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"accuracy_meters" numeric(10, 2),
	"distance_meters" numeric(10, 2),
	"status" varchar(30) NOT NULL,
	"captured_at" timestamp with time zone,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "location_validation_id" uuid;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "geofence_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "minimum_location_accuracy_meters" numeric(8, 2) DEFAULT '30' NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "location_max_age_seconds" bigint DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "geofence_policy_changes" ADD CONSTRAINT "geofence_policy_changes_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_policy_changes" ADD CONSTRAINT "geofence_policy_changes_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_validations" ADD CONSTRAINT "location_validations_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_validations" ADD CONSTRAINT "location_validations_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geofence_policy_changes_establishment_idx" ON "geofence_policy_changes" USING btree ("establishment_id","created_at");--> statement-breakpoint
CREATE INDEX "location_validations_collector_time_idx" ON "location_validations" USING btree ("collector_id","created_at");--> statement-breakpoint
CREATE INDEX "location_validations_establishment_time_idx" ON "location_validations" USING btree ("establishment_id","created_at");