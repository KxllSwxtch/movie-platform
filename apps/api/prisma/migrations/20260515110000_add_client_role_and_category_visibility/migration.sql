ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT';

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "categories_is_active_order_idx" ON "categories"("is_active", "order");
