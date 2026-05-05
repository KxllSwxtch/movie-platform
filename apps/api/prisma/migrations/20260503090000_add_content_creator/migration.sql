ALTER TABLE "content" ADD COLUMN "creator_id" TEXT;

CREATE INDEX "content_creator_id_idx" ON "content"("creator_id");

ALTER TABLE "content" ADD CONSTRAINT "content_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
