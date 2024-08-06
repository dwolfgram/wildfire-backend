-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discoverWeeklySelected" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "discoverWeeklySelected" = true;