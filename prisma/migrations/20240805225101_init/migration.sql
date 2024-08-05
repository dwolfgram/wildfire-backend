-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "songId" UUID;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;
