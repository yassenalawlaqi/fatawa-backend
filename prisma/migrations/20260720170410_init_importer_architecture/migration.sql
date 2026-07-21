/*
  Warnings:

  - You are about to drop the `import_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "fatawa" ADD COLUMN     "sync_status" TEXT NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "import_logs";

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "source" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_status" (
    "source" TEXT NOT NULL,
    "last_sync" TIMESTAMP(3),
    "next_sync" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("source")
);
