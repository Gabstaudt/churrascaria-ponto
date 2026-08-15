CREATE TABLE "rep_collector_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collector_id" uuid NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rep_collector_activations" ADD CONSTRAINT "rep_collector_activations_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_collector_activations" ADD CONSTRAINT "rep_collector_activations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rep_collector_activations_code_unique" ON "rep_collector_activations" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "rep_collector_activations_collector_idx" ON "rep_collector_activations" USING btree ("collector_id");