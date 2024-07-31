/*
  Warnings:

  - You are about to drop the column `originSongId` on the `Song` table. All the data in the column will be lost.
  - You are about to drop the `LikedSong` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "TrackType" ADD VALUE 'WILDFIRE_LIKE';

-- DropForeignKey
ALTER TABLE "LikedSong" DROP CONSTRAINT "LikedSong_originSongId_fkey";

-- DropForeignKey
ALTER TABLE "LikedSong" DROP CONSTRAINT "LikedSong_userId_fkey";

-- DropForeignKey
ALTER TABLE "Song" DROP CONSTRAINT "Song_originSongId_fkey";

-- DropIndex
DROP INDEX "Song_receiverId_idx";

-- AlterTable
ALTER TABLE "Song" DROP COLUMN "originSongId";

-- DropTable
DROP TABLE "LikedSong";

-- CreateTable
CREATE TABLE "_SongHistory" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SongHistory_AB_unique" ON "_SongHistory"("A", "B");

-- CreateIndex
CREATE INDEX "_SongHistory_B_index" ON "_SongHistory"("B");

-- CreateIndex
CREATE INDEX "Conversation_id_userAId_userBId_idx" ON "Conversation"("id", "userAId", "userBId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Song_conversationId_idx" ON "Song"("conversationId");

-- CreateIndex
CREATE INDEX "Song_userId_trackType_idx" ON "Song"("userId", "trackType");

-- AddForeignKey
ALTER TABLE "_SongHistory" ADD CONSTRAINT "_SongHistory_A_fkey" FOREIGN KEY ("A") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SongHistory" ADD CONSTRAINT "_SongHistory_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
