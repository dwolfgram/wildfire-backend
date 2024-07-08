/*
  Warnings:

  - You are about to drop the `_SongHistoryToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `senderId` to the `SongHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_SongHistoryToUser" DROP CONSTRAINT "_SongHistoryToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SongHistoryToUser" DROP CONSTRAINT "_SongHistoryToUser_B_fkey";

-- AlterTable
ALTER TABLE "SongHistory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderId" UUID NOT NULL;

-- DropTable
DROP TABLE "_SongHistoryToUser";

-- CreateIndex
CREATE INDEX "SongHistory_songId_idx" ON "SongHistory"("songId");

-- AddForeignKey
ALTER TABLE "SongHistory" ADD CONSTRAINT "SongHistory_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
