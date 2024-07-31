/*
  Warnings:

  - You are about to drop the `SentSong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTrack` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "TrackType" ADD VALUE 'SENT_TRACK';

-- DropForeignKey
ALTER TABLE "LikedSong" DROP CONSTRAINT "LikedSong_originSongId_fkey";

-- DropForeignKey
ALTER TABLE "SentSong" DROP CONSTRAINT "SentSong_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "SentSong" DROP CONSTRAINT "SentSong_originSongId_fkey";

-- DropForeignKey
ALTER TABLE "SentSong" DROP CONSTRAINT "SentSong_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "SentSong" DROP CONSTRAINT "SentSong_senderId_fkey";

-- DropForeignKey
ALTER TABLE "UserTrack" DROP CONSTRAINT "UserTrack_userId_fkey";

-- DropTable
DROP TABLE "SentSong";

-- DropTable
DROP TABLE "UserTrack";

-- CreateTable
CREATE TABLE "Song" (
    "id" UUID NOT NULL,
    "senderId" UUID,
    "receiverId" UUID,
    "spotifyId" TEXT NOT NULL,
    "albumImage" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "spotifyUri" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistUri" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "seenAt" TIMESTAMP(3),
    "trackType" "TrackType" NOT NULL,
    "conversationId" UUID,
    "originSongId" UUID,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Song_receiverId_idx" ON "Song"("receiverId");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_originSongId_fkey" FOREIGN KEY ("originSongId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedSong" ADD CONSTRAINT "LikedSong_originSongId_fkey" FOREIGN KEY ("originSongId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;
