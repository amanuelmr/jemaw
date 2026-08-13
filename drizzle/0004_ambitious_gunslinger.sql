ALTER TABLE "bill_splits" ALTER COLUMN "amount" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "amount" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "jemaw_members" ALTER COLUMN "balance" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "jemaw_members" ALTER COLUMN "balance" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "amount" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "settlements" ALTER COLUMN "amount" SET DATA TYPE numeric(16, 4);