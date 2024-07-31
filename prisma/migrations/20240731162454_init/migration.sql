-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdInitialTracksAt" DROP NOT NULL,
ALTER COLUMN "createdInitialTracksAt" DROP DEFAULT;
