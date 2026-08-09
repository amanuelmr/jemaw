CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"link" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "receipt_url" text;--> statement-breakpoint
ALTER TABLE "jemaws" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "payment_proof_url" text;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_jemaw_idx" ON "activity_logs" USING btree ("jemaw_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bill_splits_bill_user_unique" ON "bill_splits" USING btree ("bill_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bills_jemaw_status_created_idx" ON "bills" USING btree ("jemaw_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jemaw_members_jemaw_user_unique" ON "jemaw_members" USING btree ("jemaw_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_receiver_status_created_idx" ON "settlements" USING btree ("receiver_id","status","created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_amount_positive" CHECK ("bill_splits"."amount" > 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_amount_positive" CHECK ("bills"."amount" > 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_positive" CHECK ("settlements"."amount" > 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settlements" ADD CONSTRAINT "settlements_distinct_parties" CHECK ("settlements"."payer_id" <> "settlements"."receiver_id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
