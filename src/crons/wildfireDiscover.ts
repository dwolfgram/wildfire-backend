import db from "@/lib/db"
import { UserTrackService } from "@/modules/user-track/user-track.service"
import { formatSpotifyToken } from "@/utils/formatSpotifyToken"
import { wait } from "@/utils/wait"
import { PrismaClient } from "@prisma/client"
import cron from "node-cron"
import moment from "moment-timezone"
import { NotificationService } from "@/modules/notifications/notification.service"

let isProccessing = false

async function processWildfireDiscover() {
  try {
    const notificationService = new NotificationService()

    isProccessing = true
    const allUsers = await db.user.findMany({
      include: {
        spotifyTokens: true,
      },
    })

    console.log("Wildfire playlists to process:", allUsers.length)

    const userTracksService = new UserTrackService()

    for (const user of allUsers) {
      try {
        const spotifyTokens = user.spotifyTokens[0]
        if (!spotifyTokens) {
          console.log("USER HAS NO SPOTIFY TOKENS, SKIPPING!")
          continue
        }
        const spotifyApiConfig = formatSpotifyToken(spotifyTokens)
        const userId = user.id
        const disoverWeeklyId = user.discoverWeeklyId

        if (!disoverWeeklyId) {
          console.log("CANNOT PULL USER TRACKS, NO DISCOVER WEEKLY ID")
          continue
        }

        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const effectiveDate =
          user.createdInitialTracksAt &&
          user.createdInitialTracksAt > oneWeekAgo
            ? user.createdInitialTracksAt
            : oneWeekAgo

        await db.$transaction(
          async (prisma) => {
            await userTracksService.getAndStoreSpotifyLikesAfterDdate(
              userId,
              effectiveDate,
              spotifyApiConfig,
              prisma as PrismaClient
            ),
              await userTracksService.getAndStoreUsersTopListens(
                userId,
                spotifyApiConfig,
                prisma as PrismaClient
              ),
              await userTracksService.getAndStoreDiscoverWeeklySongs(
                userId,
                disoverWeeklyId,
                spotifyApiConfig,
                prisma as PrismaClient
              )
          },
          {
            timeout: 10000000,
          }
        )

        await wait(10000)
        isProccessing = false
        console.log(`Processed user ${user.id}`)
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error)
      }
    }
    await notificationService.sendAllUsersWildfireWeeklyNotification()
  } catch (err) {
    console.log("error proccessing wildfire discover weeklys", err)
  }
}

cron.schedule(
  "0 0 * * 3",
  async () => {
    const now = moment().tz("America/New_York")
    if (now.day() === 3 && now.hour() === 0 && now.minute() === 0) {
      await processWildfireDiscover()
    }
  },
  {
    timezone: "America/New_York",
  }
)
