-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "scholars" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "official_url" TEXT,
    "license_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fatawa" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "scholar_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "source_book" TEXT,
    "volume" TEXT,
    "page" TEXT,
    "official_url" TEXT,
    "source_fingerprint" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,

    CONSTRAINT "fatawa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_index" (
    "fatwa_id" UUID NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "search_vector" tsvector,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("fatwa_id")
);

-- CreateTable
CREATE TABLE "fatwa_revisions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fatwa_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fatwa_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fatwa_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "word" TEXT NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fatwa_keywords" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fatwa_id" UUID NOT NULL,
    "keyword_id" UUID NOT NULL,

    CONSTRAINT "fatwa_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synonyms" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "word" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,

    CONSTRAINT "synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "query" TEXT NOT NULL,
    "results_count" INTEGER NOT NULL,
    "execution_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "new_fatawa_count" INTEGER NOT NULL DEFAULT 0,
    "updated_fatawa_count" INTEGER NOT NULL DEFAULT 0,
    "duplicated_fatawa_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "execution_time_ms" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metadata" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "scholars_slug_key" ON "scholars"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fatawa_slug_key" ON "fatawa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fatawa_source_fingerprint_key" ON "fatawa"("source_fingerprint");

-- CreateIndex
CREATE INDEX "fatawa_scholar_id_idx" ON "fatawa"("scholar_id");

-- CreateIndex
CREATE INDEX "fatawa_category_id_idx" ON "fatawa"("category_id");

-- CreateIndex
CREATE INDEX "fatawa_source_id_idx" ON "fatawa"("source_id");

-- CreateIndex
CREATE INDEX "fatawa_verification_status_idx" ON "fatawa"("verification_status");

-- CreateIndex
CREATE INDEX "search_index_search_vector_idx" ON "search_index" USING GIN ("search_vector");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_word_key" ON "keywords"("word");

-- CreateIndex
CREATE UNIQUE INDEX "fatwa_keywords_fatwa_id_keyword_id_key" ON "fatwa_keywords"("fatwa_id", "keyword_id");

-- CreateIndex
CREATE UNIQUE INDEX "synonyms_word_synonym_key" ON "synonyms"("word", "synonym");

-- AddForeignKey
ALTER TABLE "fatawa" ADD CONSTRAINT "fatawa_scholar_id_fkey" FOREIGN KEY ("scholar_id") REFERENCES "scholars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatawa" ADD CONSTRAINT "fatawa_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatawa" ADD CONSTRAINT "fatawa_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_index" ADD CONSTRAINT "search_index_fatwa_id_fkey" FOREIGN KEY ("fatwa_id") REFERENCES "fatawa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatwa_revisions" ADD CONSTRAINT "fatwa_revisions_fatwa_id_fkey" FOREIGN KEY ("fatwa_id") REFERENCES "fatawa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_fatwa_id_fkey" FOREIGN KEY ("fatwa_id") REFERENCES "fatawa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatwa_keywords" ADD CONSTRAINT "fatwa_keywords_fatwa_id_fkey" FOREIGN KEY ("fatwa_id") REFERENCES "fatawa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fatwa_keywords" ADD CONSTRAINT "fatwa_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FTS Setup: Create trigger function for auto-syncing search_vector
CREATE OR REPLACE FUNCTION fatawa_search_index_sync() RETURNS trigger AS $$
BEGIN
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

-- FTS Setup: Create trigger on fatawa table
DROP TRIGGER IF EXISTS tsvector_sync ON "fatawa";
CREATE TRIGGER tsvector_sync
  AFTER INSERT OR UPDATE ON "fatawa"
  FOR EACH ROW
  EXECUTE FUNCTION fatawa_search_index_sync();
