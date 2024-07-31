/*
  Warnings:

  - Made the column `conversationId` on table `SentSong` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SentSong" DROP CONSTRAINT "SentSong_conversationId_fkey";

-- AlterTable
ALTER TABLE "SentSong" ALTER COLUMN "conversationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SentSong" ADD CONSTRAINT "SentSong_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
