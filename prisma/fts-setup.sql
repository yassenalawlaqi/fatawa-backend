-- FTS Setup Script for PostgreSQL
-- Run this AFTER the initial Prisma migration

-- 1. Create the tsvector column on the `search_index` table is handled by Prisma schema natively via Unsupported("tsvector").

-- 2. Create the GIN Index for fast searching (Also handled by Prisma via `@@index([searchVector], type: Gin)`)

-- 3. Create a function to automatically update the search_vector inside `search_index` table
-- When a fatwa is inserted/updated, we want to update the search_index table.
CREATE OR REPLACE FUNCTION fatawa_search_index_sync() RETURNS trigger AS $$
BEGIN
  -- Insert or update the search_index table
  INSERT INTO "search_index" ("fatwa_id", "normalized_text", "search_vector", "updated_at")
  VALUES (
    NEW.id,
    coalesce(NEW.question, '') || ' ' || coalesce(NEW.answer, ''),
    setweight(to_tsvector('simple', coalesce(NEW.question, '')), 'A') || setweight(to_tsvector('simple', coalesce(NEW.answer, '')), 'B'),
    NOW()
  )
  ON CONFLICT ("fatwa_id") DO UPDATE SET
    "normalized_text" = EXCLUDED."normalized_text",
    "search_vector" = EXCLUDED."search_vector",
    "updated_at" = NOW();
    
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 4. Create a trigger that fires after insert or update on `fatawa`
DROP TRIGGER IF EXISTS tsvector_sync ON "fatawa";
CREATE TRIGGER tsvector_sync
  AFTER INSERT OR UPDATE ON "fatawa"
  FOR EACH ROW
  EXECUTE FUNCTION fatawa_search_index_sync();
