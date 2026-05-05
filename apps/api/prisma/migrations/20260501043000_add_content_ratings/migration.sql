CREATE TABLE "content_ratings" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_ratings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_ratings_user_id_content_id_key" ON "content_ratings"("user_id", "content_id");
CREATE INDEX "content_ratings_content_id_created_at_idx" ON "content_ratings"("content_id", "created_at");
CREATE INDEX "content_ratings_user_id_idx" ON "content_ratings"("user_id");

ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
