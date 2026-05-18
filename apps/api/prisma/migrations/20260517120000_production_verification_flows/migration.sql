ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'VERIFICATION';

ALTER TABLE "user_verifications"
  ADD COLUMN IF NOT EXISTS "document_key" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmed_by_partner_id" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "partner_relationship_id" TEXT;

CREATE INDEX IF NOT EXISTS "user_verifications_confirmed_by_partner_id_idx"
  ON "user_verifications"("confirmed_by_partner_id");

CREATE INDEX IF NOT EXISTS "user_verifications_partner_relationship_id_idx"
  ON "user_verifications"("partner_relationship_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_verifications_confirmed_by_partner_id_fkey'
      AND conrelid = 'user_verifications'::regclass
  ) THEN
    ALTER TABLE "user_verifications"
      ADD CONSTRAINT "user_verifications_confirmed_by_partner_id_fkey"
      FOREIGN KEY ("confirmed_by_partner_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_verifications_partner_relationship_id_fkey'
      AND conrelid = 'user_verifications'::regclass
  ) THEN
    ALTER TABLE "user_verifications"
      ADD CONSTRAINT "user_verifications_partner_relationship_id_fkey"
      FOREIGN KEY ("partner_relationship_id") REFERENCES "partner_relationships"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
