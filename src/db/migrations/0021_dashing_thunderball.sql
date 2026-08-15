ALTER TYPE "public"."time_entry_source" ADD VALUE 'REP_P';--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "establishment_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "registrar_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "collector_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "nsr" varchar(30);--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_registrar_nsr_unique" ON "time_entries" USING btree ("registrar_id","nsr");--> statement-breakpoint
CREATE INDEX "time_entries_establishment_idx" ON "time_entries" USING btree ("establishment_id","occurred_at");