ALTER TABLE "establishments" ADD COLUMN "cnpj" varchar(14) NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "timezone" varchar(50) DEFAULT 'America/Belem' NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "geofence_radius_meters" numeric(8, 2);--> statement-breakpoint
CREATE UNIQUE INDEX "establishments_cnpj_unique" ON "establishments" USING btree ("cnpj");--> statement-breakpoint
CREATE INDEX "establishments_active_idx" ON "establishments" USING btree ("is_active");