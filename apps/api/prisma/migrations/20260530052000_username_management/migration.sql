ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "username_updated_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "username_change_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "users"
SET "username" = CONCAT('partner_', SUBSTRING(REPLACE("id"::text, '-', ''), 1, 12))
WHERE "role" = 'PARTNER'
  AND "username" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_lower_unique"
ON "users" (LOWER("username"))
WHERE "username" IS NOT NULL;
