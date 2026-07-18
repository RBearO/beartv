-- AlterTable
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "appearance" JSONB;
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "appearanceUpdatedAt" TIMESTAMP(3);
