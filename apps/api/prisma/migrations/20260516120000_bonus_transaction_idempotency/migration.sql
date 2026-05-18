CREATE UNIQUE INDEX IF NOT EXISTS "bonus_transactions_user_source_reference_unique"
  ON "bonus_transactions"("user_id", "source", "reference_id", "reference_type");
