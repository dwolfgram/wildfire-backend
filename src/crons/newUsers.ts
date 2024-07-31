import db from "@/lib/db"
import { UserTrackService } from "@/modules/user-track/user-track.service"
import { formatSpotifyToken } from "@/utils/formatSpotifyToken"
import { wait } from "@/utils/wait"
import { PrismaClient } from "@prisma/client"
import cron from "node-cron"

let isProccessing = false

async function processNewUsers() {
  try {
    isProccessing = true
    const newUsers = await db.user.findMany({
      where: {
        username: { not: null },
        discoverWeeklyId: { not: null },
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

        if (!disoverWeeklyId) {
          console.log("CANNOT PULL USER TRACKS, NO DISCOVER WEEKLY ID")
          continue
        }

        await db.$transaction(
          async (prisma) => {
            await userTracksService.getAndStoreAllUserSpotifyLikes(
              userId,
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

        await wait(10000)
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
