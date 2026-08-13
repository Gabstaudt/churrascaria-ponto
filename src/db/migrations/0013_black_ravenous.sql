CREATE TYPE "public"."correction_request_type" AS ENUM('ADD_ENTRY', 'IGNORE_ENTRY', 'FORGOTTEN_EXIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."medical_certificate_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "correction_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "correction_request_type" NOT NULL,
	"requested_time" varchar(5),
	"reason" text NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"review_reason" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manager_user_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(500),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medical_certificates" ALTER COLUMN "approved_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_certificates" ALTER COLUMN "approved_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "medical_certificates" ALTER COLUMN "approved_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employee_id" uuid;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD COLUMN "status" "medical_certificate_status" DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "medical_certificates" ADD COLUMN "review_reason" text;--> statement-breakpoint
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_employees" ADD CONSTRAINT "manager_employees_manager_user_id_users_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_employees" ADD CONSTRAINT "manager_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_employees" ADD CONSTRAINT "manager_employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "correction_requests_employee_idx" ON "correction_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "correction_requests_status_idx" ON "correction_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "manager_employees_unique" ON "manager_employees" USING btree ("manager_user_id","employee_id");--> statement-breakpoint
CREATE INDEX "manager_employees_manager_idx" ON "manager_employees" USING btree ("manager_user_id");--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_employee_idx" ON "users" USING btree ("employee_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id");