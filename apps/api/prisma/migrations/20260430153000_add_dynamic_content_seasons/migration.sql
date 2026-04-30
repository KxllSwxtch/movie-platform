-- Add explicit seasons/chapters so structured content can start empty and grow over time.
CREATE TABLE "content_seasons" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_seasons_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "series" ADD COLUMN "season_id" TEXT;

CREATE UNIQUE INDEX "content_seasons_content_id_season_number_key" ON "content_seasons"("content_id", "season_number");
CREATE INDEX "content_seasons_content_id_idx" ON "content_seasons"("content_id");
CREATE INDEX "series_season_id_idx" ON "series"("season_id");

ALTER TABLE "content_seasons"
  ADD CONSTRAINT "content_seasons_content_id_fkey"
  FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "series"
  ADD CONSTRAINT "series_season_id_fkey"
  FOREIGN KEY ("season_id") REFERENCES "content_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
