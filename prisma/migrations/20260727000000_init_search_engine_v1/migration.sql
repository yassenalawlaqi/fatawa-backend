-- Migration: init_search_engine_v1
-- Safe for production: Only adds new columns with defaults. No data loss.

-- AlterTable: Add parent_id to categories (nullable, safe)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" UUID;

-- AlterTable: Add view_count to fatawa (with default 0, safe)
ALTER TABLE "fatawa" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey: categories self-reference for hierarchy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_parent_id_fkey'
  ) THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" 
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
