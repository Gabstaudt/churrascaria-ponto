CREATE TABLE "rep_p_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"registrar_id" uuid,
	"collector_id" uuid,
	"employee_id" uuid,
	"nsr" varchar(30),
	"reason_code" varchar(50),
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rep_p_events" ADD CONSTRAINT "rep_p_events_registrar_id_rep_registrars_id_fk" FOREIGN KEY ("registrar_id") REFERENCES "public"."rep_registrars"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_p_events" ADD CONSTRAINT "rep_p_events_collector_id_rep_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."rep_collectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rep_p_events" ADD CONSTRAINT "rep_p_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rep_p_events_registrar_time_idx" ON "rep_p_events" USING btree ("registrar_id","occurred_at");--> statement-breakpoint
CREATE INDEX "rep_p_events_collector_time_idx" ON "rep_p_events" USING btree ("collector_id","occurred_at");