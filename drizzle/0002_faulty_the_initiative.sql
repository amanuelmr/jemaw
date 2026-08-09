CREATE TYPE "public"."ledger_source_type" AS ENUM('bill', 'settlement', 'reversal', 'adjustment');--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jemaw_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"currency" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"source_type" "ledger_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_amount_nonzero" CHECK ("ledger_entries"."amount" <> 0)
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_jemaw_id_jemaws_id_fk" FOREIGN KEY ("jemaw_id") REFERENCES "public"."jemaws"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_entries_jemaw_created_idx" ON "ledger_entries" USING btree ("jemaw_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_user_created_idx" ON "ledger_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_source_user_unique" ON "ledger_entries" USING btree ("source_type","source_id","user_id");--> statement-breakpoint
INSERT INTO "ledger_entries" (
	"jemaw_id",
	"user_id",
	"currency",
	"amount",
	"source_type",
	"source_id",
	"description",
	"created_at"
)
SELECT
	b."jemaw_id",
	b."paid_by_id",
	j."currency",
	SUM(bs."amount"),
	'bill'::"ledger_source_type",
	b."id",
	b."description",
	COALESCE(b."approved_at", b."created_at")
FROM "bills" b
JOIN "jemaws" j ON j."id" = b."jemaw_id"
JOIN "bill_splits" bs ON bs."bill_id" = b."id" AND bs."user_id" <> b."paid_by_id"
WHERE b."status" = 'approved'
GROUP BY b."id", b."jemaw_id", b."paid_by_id", j."currency", b."description", b."approved_at", b."created_at"
HAVING SUM(bs."amount") <> 0
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "ledger_entries" (
	"jemaw_id",
	"user_id",
	"currency",
	"amount",
	"source_type",
	"source_id",
	"description",
	"created_at"
)
SELECT
	b."jemaw_id",
	bs."user_id",
	j."currency",
	-bs."amount",
	'bill'::"ledger_source_type",
	b."id",
	b."description",
	COALESCE(b."approved_at", b."created_at")
FROM "bills" b
JOIN "jemaws" j ON j."id" = b."jemaw_id"
JOIN "bill_splits" bs ON bs."bill_id" = b."id" AND bs."user_id" <> b."paid_by_id"
WHERE b."status" = 'approved'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "ledger_entries" (
	"jemaw_id", "user_id", "currency", "amount", "source_type", "source_id", "description", "created_at"
)
SELECT
	s."jemaw_id", s."payer_id", j."currency", s."amount", 'settlement'::"ledger_source_type", s."id", s."description", COALESCE(s."approved_at", s."created_at")
FROM "settlements" s
JOIN "jemaws" j ON j."id" = s."jemaw_id"
WHERE s."status" = 'approved'
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "ledger_entries" (
	"jemaw_id", "user_id", "currency", "amount", "source_type", "source_id", "description", "created_at"
)
SELECT
	s."jemaw_id", s."receiver_id", j."currency", -s."amount", 'settlement'::"ledger_source_type", s."id", s."description", COALESCE(s."approved_at", s."created_at")
FROM "settlements" s
JOIN "jemaws" j ON j."id" = s."jemaw_id"
WHERE s."status" = 'approved'
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "jemaw_members" jm
SET "balance" = COALESCE((
	SELECT SUM(le."amount")
	FROM "ledger_entries" le
	WHERE le."jemaw_id" = jm."jemaw_id" AND le."user_id" = jm."user_id"
), 0);
