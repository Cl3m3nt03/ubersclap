CREATE TYPE "public"."client_category" AS ENUM('VIP', 'BUSINESS', 'REGULAR', 'OCCASIONAL', 'PROSPECT');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('ONE_WAY', 'ROUND_TRIP', 'AIRPORT', 'STATION', 'EVENT', 'HOURLY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('FUEL', 'TOLL', 'PARKING', 'MAINTENANCE', 'INSURANCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('DIESEL', 'GASOLINE', 'HYBRID', 'ELECTRIC');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('DRIVER', 'MANAGER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."vat_regime" AS ENUM('FRANCHISE', 'NORMAL');--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(200),
	"legal_form" varchar(100),
	"siret" varchar(14),
	"vat_number" varchar(20),
	"vtc_registration_number" varchar(50),
	"vat_regime" "vat_regime",
	"address" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(20),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "user_role" DEFAULT 'DRIVER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(320),
	"company" varchar(200),
	"category" "client_category" DEFAULT 'OCCASIONAL' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"type" "course_type" DEFAULT 'ONE_WAY' NOT NULL,
	"status" "course_status" DEFAULT 'DRAFT' NOT NULL,
	"pickup_label" text NOT NULL,
	"pickup_lat" double precision,
	"pickup_lng" double precision,
	"destination_label" text NOT NULL,
	"destination_lat" double precision,
	"destination_lng" double precision,
	"scheduled_at" timestamp with time zone NOT NULL,
	"timezone" varchar(64) DEFAULT 'Europe/Paris' NOT NULL,
	"passengers" integer DEFAULT 1 NOT NULL,
	"luggage" integer DEFAULT 0 NOT NULL,
	"child_seat" boolean DEFAULT false NOT NULL,
	"price_incl_tax_cents" integer NOT NULL,
	"final_price_incl_tax_cents" integer,
	"distance_meters" integer,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"course_id" uuid,
	"vehicle_id" uuid,
	"category" "expense_category" NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"spent_at" timestamp with time zone NOT NULL,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"registration" varchar(20) NOT NULL,
	"year" integer,
	"fuel_type" "fuel_type",
	"current_km" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"credit_note_number" varchar(20) NOT NULL,
	"reason" text NOT NULL,
	"total_excl_tax_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_incl_tax_cents" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_notes_driver_number" UNIQUE("driver_id","credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoice_id" uuid NOT NULL,
	"course_id" uuid,
	"label" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_excl_tax_cents" integer NOT NULL,
	"tax_rate" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_sequences" (
	"driver_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_sequences_driver_year" UNIQUE("driver_id","year")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"total_excl_tax_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_incl_tax_cents" integer NOT NULL,
	"issuer_snapshot" text,
	"pdf_url" text,
	"factur_x_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_driver_number" UNIQUE("driver_id","invoice_number")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driver_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity" varchar(64) NOT NULL,
	"entity_id" uuid,
	"metadata" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" varchar(128) NOT NULL,
	"driver_id" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"device_name" varchar(128),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "clients_driver_name_idx" ON "clients" USING btree ("driver_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "clients_driver_phone_idx" ON "clients" USING btree ("driver_id","phone");--> statement-breakpoint
CREATE INDEX "courses_driver_scheduled_idx" ON "courses" USING btree ("driver_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "courses_driver_status_idx" ON "courses" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "courses_client_idx" ON "courses" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "expenses_driver_spent_idx" ON "expenses" USING btree ("driver_id","spent_at");--> statement-breakpoint
CREATE INDEX "vehicles_driver_idx" ON "vehicles" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_driver_status_idx" ON "invoices" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "invoices_client_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "audit_logs_driver_created_idx" ON "audit_logs" USING btree ("driver_id","created_at");--> statement-breakpoint
CREATE INDEX "idempotency_lookup_idx" ON "idempotency_keys" USING btree ("driver_id","key");--> statement-breakpoint
CREATE INDEX "idempotency_expiry_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");