-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('SAVED_TRACK', 'TOP_LISTEN', 'DISCOVER_WEEKLY');

-- CreateTable
CREATE TABLE "UserTrack" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "spotifyUri" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistUri" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "albumImage" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "trackType" "TrackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrack_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserTrack" ADD CONSTRAINT "UserTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
