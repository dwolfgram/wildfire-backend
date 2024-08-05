import db from "@/lib/db"
import { withSpotifyApi } from "@/utils/withSpotifyApi"
import { Song, TrackType, User } from "@prisma/client"
import { AccessToken } from "@spotify/web-api-ts-sdk"
import dotenv from "dotenv"
import { NotificationService } from "../notifications/notification.service"

dotenv.config()

export class SongService {
  sendSong = async (data: Song, historySongIds: string[]) => {
    try {
      let conversation = await db.conversation.findFirst({
        where: {
          OR: [
            { userAId: data.senderId!, userBId: data.receiverId! },
            { userAId: data.receiverId!, userBId: data.senderId! },
          ],
        },
      })

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            userAId: data.senderId!,
            userBId: data.receiverId!,
          },
        })
      }

      // if no history check if
      if (historySongIds.length === 0) {
        const existingSongOrLike = await db.song.findFirst({
          where: {
            OR: [
              {
                trackType: "WILDFIRE_LIKE",
                userId: data.senderId,
                spotifyId: data.spotifyId,
              },
              {
                trackType: "SENT_TRACK",
                receiverId: data.senderId,
                spotifyId: data.spotifyId,
              },
            ],
          },
          include: {
            history: {
              select: {
                id: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        if (existingSongOrLike) {
          const { trackType, id, history } = existingSongOrLike

          if (trackType === "SENT_TRACK") {
            historySongIds.push(id)
          } else if (trackType === "WILDFIRE_LIKE" && history.length > 0) {
            historySongIds.push(history[0].id)
          }
        }
      }

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
            connect: historySongIds.map((songId: string) => ({ id: songId })),
          },
          trackType: TrackType.SENT_TRACK,
        },
        include: {
          sender: {
            select: {
              username: true,
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

      const notificationService = new NotificationService()
      await notificationService.sendNotification({
        toUserId: data.receiverId!,
        fromUserId: data.senderId!,
        title: `@${newSong.sender?.username}`,
        message: `sent you a song`,
        type: "RECEIVED_SONG",
      })

      if (historySongIds.length > 0) {
        const historySongs = await db.song.findMany({
          where: {
            id: {
              in: historySongIds,
            },
          },
        })
        for (const song of historySongs.slice(0, 4))
          await notificationService.sendNotification({
            toUserId: song.userId! || song.senderId!,
            fromUserId: data.senderId!,
            title: `@${newSong.sender?.username}`,
            message: `shared a song they found from you`,
            type: "SHARED_SONG",
          })
      }

      return newSong
    } catch (error) {
      console.error("Error sending song:", error)
      throw new Error("Unable to send song")
    }
  }
  getSongHistoryWithTimeline = async (songId: string) => {
    try {
      // Fetch the song's history
      const songWithHistory = await db.song.findUnique({
        where: {
          id: songId,
        },
        select: {
          id: true,
          trackType: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              username: true,
              pfp: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              pfp: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              pfp: true,
            },
          },
          history: {
            select: {
              id: true,
              createdAt: true,
              trackType: true,
              name: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
              sender: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
            },
          },
          inHistoryOf: {
            select: {
              id: true,
              createdAt: true,
              trackType: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
              sender: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
            },
          },
        },
      })

      if (!songWithHistory) {
        throw new Error("Song not found")
      }

      const combinedHistory = [...songWithHistory.history]

      return [
        {
          ...songWithHistory,
          combinedHistory,
        },
        ...combinedHistory,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (error) {
      console.error("Error fetching song history with timeline:", error)
      throw error
    }
  }
  getTrackById = async (spotifyConfig: AccessToken, trackId: string) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        const data = await spotify.tracks.get(trackId)
        return data
      } catch (error) {
        console.error("Error getting devices:", error)
        throw new Error("Unable to get devices")
      }
    })
  likeSong = async (
    spotifyConfig: AccessToken,
    authUser: User,
    data: Song,
    historySongIds: string[]
  ) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        const isSaved = await spotify.currentUser.tracks.hasSavedTracks([
          data.spotifyId,
        ])
        if (!isSaved[0]) {
          await spotify.currentUser.tracks.saveTracks([data.spotifyId])
        }

        const newSong = await db.song.create({
          data: {
            name: data.name,
            userId: authUser.id,
            spotifyId: data.spotifyId,
            spotifyUri: data.spotifyUri,
            albumImage: data.albumImage,
            albumName: data.albumName,
            artistName: data.artistName,
            artistUri: data.artistUri,
            durationMs: data.durationMs,
            history: {
              connect: historySongIds.map((songId: string) => ({ id: songId })),
            },
            trackType: TrackType.WILDFIRE_LIKE,
          },
        })

        const notificationService = new NotificationService()

        if (historySongIds.length > 0) {
          const historySongs = await db.song.findMany({
            where: {
              id: {
                in: historySongIds,
              },
            },
          })
          for (const song of historySongs.slice(0, 4))
            await notificationService.sendNotification({
              toUserId: song.userId! || song.senderId!,
              fromUserId: data.senderId! || data.userId!,
              title: `@${authUser.username}`,
              message: `liked a song they found from you`,
              type: "LIKED_SONG",
            })
        }

        return newSong
      } catch (error) {
        console.error("Error sending song:", error)
        throw new Error("Unable to send song")
      }
    })
  unlikeSong = async (
    spotifyConfig: AccessToken,
    authUserId: string,
    spotifyId: string
  ) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        const isSaved = await spotify.currentUser.tracks.hasSavedTracks([
          spotifyId,
        ])
        if (isSaved[0]) {
          await spotify.currentUser.tracks.removeSavedTracks([spotifyId])
        }

        await db.song.deleteMany({
          where: {
            userId: authUserId,
            spotifyId,
            OR: [
              {
                trackType: TrackType.SAVED_TRACK,
              },
              {
                trackType: TrackType.WILDFIRE_LIKE,
              },
            ],
          },
        })
        return { success: true }
      } catch (error) {
        console.error("Error sending song:", error)
        throw new Error("Unable to send song")
      }
    })
  getUserLikedSongIds = async (authUserId: string) => {
    try {
      const likedSongs = await db.song.findMany({
        where: {
          userId: authUserId,
          OR: [
            { trackType: TrackType.WILDFIRE_LIKE },
            { trackType: TrackType.SAVED_TRACK },
          ],
        },
        select: {
          spotifyId: true,
        },
      })

      return likedSongs
    } catch (error) {
      console.error("Error sending song:", error)
      throw new Error("Unable to send song")
    }
  }
}
