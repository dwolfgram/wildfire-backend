import db from "@/lib/db"
import { NotificationService } from "@/modules/notifications/notification.service"
import { UserTrackService } from "@/modules/user-track/user-track.service"
import { formatSpotifyToken } from "@/utils/formatSpotifyToken"
import { wait } from "@/utils/wait"
import { PrismaClient } from "@prisma/client"
import cron from "node-cron"

let isProccessing = false

async function processNewUsers() {
  try {
    isProccessing = true
    const notificationService = new NotificationService()

    const newUsers = await db.user.findMany({
      where: {
        username: { not: null },
        discoverWeeklySelected: true,
        userTracks: { none: {} },
      },
      include: {
        spotifyTokens: true,
      },
    })

    console.log("New users to process:", newUsers.length)

    const userTracksService = new UserTrackService()

    for (const user of newUsers) {
      try {
        const spotifyApiConfig = formatSpotifyToken(user.spotifyTokens[0])
        const userId = user.id
        const disoverWeeklyId = user.discoverWeeklyId

        if (!user.discoverWeeklySelected) {
          console.log("CANNOT PULL USER TRACKS, NO DISCOVER WEEKLY ID")
          continue
        }

        await db.$transaction(
          async (prisma) => {
            await userTracksService.getAndStoreAllUserSpotifyLikes(
              userId,
              spotifyApiConfig,
              prisma as PrismaClient
            )
            await userTracksService.getAndStoreUsersTopListens(
              userId,
              spotifyApiConfig,
              prisma as PrismaClient
            )
            if (disoverWeeklyId) {
              await userTracksService.getAndStoreDiscoverWeeklySongs(
                userId,
                disoverWeeklyId,
                spotifyApiConfig,
                prisma as PrismaClient
              )
            }

            await prisma.user.update({
              where: {
                id: userId,
              },
              data: {
                createdInitialTracksAt: new Date(),
              },
            })
          },
          {
            timeout: 10000000,
          }
        )

        await notificationService.sendNotification({
          toUserId: userId,
          title: `@${user.username}`,
          message: "your spotify profile has synced",
          type: "ALERT",
          saveToDb: false,
        })
        await wait(30000)
        console.log(`Processed user ${user.id}`)
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error)
      }
    }
  } catch (err) {
    console.log("Error processing new users")
  } finally {
    isProccessing = false
  }
}

cron.schedule("*/5 * * * *", async () => {
  console.log("Running cron job to process new users...")
  if (!isProccessing) {
    await processNewUsers()
  }
})
