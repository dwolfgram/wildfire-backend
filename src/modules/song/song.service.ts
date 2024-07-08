import db from "@/lib/db"
import { Song, SongHistory } from "@prisma/client"
import dotenv from "dotenv"

dotenv.config()

export class SongService {
  sendSong = async (data: Song, userIdToCredit: string) => {
    try {
      let conversation = await db.conversation.findFirst({
        where: {
          OR: [
            { userAId: data.senderId, userBId: data.receiverId },
            { userAId: data.receiverId, userBId: data.senderId },
          ],
        },
      })

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            userAId: data.senderId,
            userBId: data.receiverId!,
          },
        })
      }

      const existingSongHistory =
        // @ts-expect-error
        data.history?.length > 0
          ? // @ts-expect-error
            data.history.map((item) => ({
              senderId: item.senderId,
              createdAt: item.createdAt,
            }))
          : []

      const newSong = await db.song.create({
        data: {
          name: data.name,
          senderId: data.senderId,
          receiverId: data.receiverId,
          spotifyId: data.spotifyId,
          spotifyUri: data.spotifyUri,
          albumImage: data.albumImage,
          albumName: data.albumName,
          artistName: data.artistName,
          artistUri: data.artistUri,
          durationMs: data.durationMs,
          conversationId: conversation.id,
          history: {
            createMany: {
              data: [{ senderId: userIdToCredit }, ...existingSongHistory],
            },
          },
        },
      })

      await db.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          lastMessageAt: new Date(),
        },
      })

      return newSong
    } catch (error) {
      console.error("Error sending song:", error)
      throw new Error("Unable to send song")
    }
  }
}
