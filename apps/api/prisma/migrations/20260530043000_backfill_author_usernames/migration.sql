UPDATE "users"
SET "username" = CONCAT('author_', SUBSTRING(REPLACE("id"::text, '-', ''), 1, 12))
WHERE "role" = 'AUTHOR'
  AND "username" IS NULL;
