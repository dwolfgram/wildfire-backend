import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { UnauthorizedError } from "@/errors/unauthorizedError"
import axios from "axios"
import dotenv from "dotenv"
import db from "@/lib/db"
import { encrypt } from "@/lib/encrypt"
import { createJwt } from "@/lib/jwt"
import { PrismaClient, TrackType, UserTrack } from "@prisma/client"
import { UserTrackService } from "../user-track/user-track.service"

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET as string
const AUTH_HEADER = Buffer.from(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_SECRET}`
).toString("base64")

export class AuthService {
  async signUpOrLogin(code: string, redirectUri: string) {
    const transaction = await db.$transaction(
      async (prisma) => {
        const response = await axios.post<AccessToken>(
          "https://accounts.spotify.com/api/token",
          null,
          {
            params: {
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${AUTH_HEADER}`,
            },
          }
        )

        const spotify = SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          response.data
        )

        const spotifyUserProfile = await spotify.currentUser.profile()

        let user = await prisma.user.findUnique({
          where: { email: spotifyUserProfile.email },
        })

        // Create the user if it doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: spotifyUserProfile.email,
              spotifyId: spotifyUserProfile.id,
              spotifyUri: spotifyUserProfile.uri,
              pfp: spotifyUserProfile.images[0]?.url,
              country: spotifyUserProfile.country,
              product: spotifyUserProfile.product,
              displayName: spotifyUserProfile.display_name,
              explicitContent:
                spotifyUserProfile.explicit_content?.filter_enabled || false,
            },
          })

          const userTrackService = new UserTrackService()

          await userTrackService.getAndStoreAllUserSpotifyLikes(
            user.id,
            response.data,
            prisma as PrismaClient
          )

          await userTrackService.getAndStoreUsersTopListens(
            user.id,
            response.data,
            prisma as PrismaClient
          )

          const discoverWeeklyPlaylists =
            await userTrackService.getUserDiscoverWeeklyPlaylists(response.data)

          if (discoverWeeklyPlaylists.length === 1) {
            await userTrackService.getAndStoreDiscoverWeeklySongs(
              user.id,
              discoverWeeklyPlaylists[0].id,
              response.data,
              prisma as PrismaClient
            )
            user = await prisma.user.update({
              where: { id: user.id },
              data: { discoverWeeklyId: discoverWeeklyPlaylists[0].id },
            })
          }
        }

        // Upsert the Spotify token for the user
        const spotifyToken = {
          accessToken: encrypt(response.data.access_token),
          refreshToken: encrypt(response.data.refresh_token),
          tokenType: response.data.token_type,
          expiresIn: response.data.expires_in,
          userId: user.id,
        }

        await prisma.spotifyToken.upsert({
          where: { userId: user.id },
          update: spotifyToken,
          create: spotifyToken,
        })

        // Create a JWT for the user
        const jwt = createJwt(user.id, response.data.expires_in)

        return {
          wildfire_token: jwt,
          spotify_auth: response.data,
          user,
        }
      },
      {
        timeout: 30000,
      }
    )

    return transaction
  }
  async refreshToken(refreshToken: string) {
    try {
      const existingToken = await db.spotifyToken.findFirst({
        where: { refreshToken: encrypt(refreshToken) },
      })

      if (!existingToken) {
        throw new UnauthorizedError("Refresh token is not valid.")
      }

      const response = await axios.post<AccessToken>(
        "https://accounts.spotify.com/api/token",
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${AUTH_HEADER}`,
          },
        }
      )

      const spotifyToken = {
        accessToken: encrypt(response.data.access_token),
        refreshToken: encrypt(response.data.refresh_token || refreshToken),
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        userId: existingToken.userId,
      }

      await db.spotifyToken.update({
        where: { userId: existingToken.userId },
        data: spotifyToken,
      })

      const jwt = createJwt(existingToken.userId, response.data.expires_in)

      return {
        wildfire_token: jwt,
        spotify_auth: {
          ...response.data,
          refresh_token: response.data.refresh_token || refreshToken,
        },
      }
    } catch (error) {
      console.error(error)
      throw new UnauthorizedError("Unable to refresh access tokens.")
    }
  }
}
