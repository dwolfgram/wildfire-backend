/*
  Warnings:

  - A unique constraint covering the columns `[userId,spotifyId,trackType]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Song_userId_spotifyId_trackType_key" ON "Song"("userId", "spotifyId", "trackType");
