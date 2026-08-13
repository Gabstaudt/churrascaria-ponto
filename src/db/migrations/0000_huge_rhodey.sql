CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'VACATION', 'LEAVE', 'TERMINATED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'EMPLOYEE');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"cpf" varchar(11) NOT NULL,
	"phone" varchar(15),
	"position" varchar(100) NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"admission_date" date NOT NULL,
	"status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"photo_url" varchar(2048),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "employees_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'EMPLOYEE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "employees_full_name_idx" ON "employees" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");