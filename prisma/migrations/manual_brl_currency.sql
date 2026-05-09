-- Manual migration: rename amountUsdCents → amountCents + add currency column.
-- Run this in Supabase Dashboard → SQL Editor before deploying the BRL change.
-- Idempotent: safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transaction' AND column_name = 'amountUsdCents'
  ) THEN
    ALTER TABLE "credit_transaction" RENAME COLUMN "amountUsdCents" TO "amountCents";
  END IF;
END $$;

ALTER TABLE "credit_transaction"
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'usd';

-- Backfill existing rows (already defaulted by ADD COLUMN, but explicit for clarity)
UPDATE "credit_transaction" SET "currency" = 'usd' WHERE "currency" IS NULL;
