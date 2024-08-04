import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { UnauthorizedError } from "@/errors/unauthorizedError"
import axios from "axios"
import dotenv from "dotenv"
import db from "@/lib/db"
import { encrypt } from "@/lib/encrypt"
import { createJwt } from "@/lib/jwt"
import { UserTrackService } from "../user-track/user-track.service"
import { formatSpotifyToken } from "@/utils/formatSpotifyToken"
import { NotificationService } from "../notifications/notification.service"
import { wait } from "@/utils/wait"

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET as string
const AUTH_HEADER = Buffer.from(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_SECRET}`
).toString("base64")

export class AuthService {
  async swapCodeForTokens(code: string, redirectUri: string) {
    const { data } = await axios.post<AccessToken>(
      "https://accounts.spotify.com/api/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri || "com.wildfire.rn://",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${AUTH_HEADER}`,
        },
      }
    )
    return data
  }
  async signUpOrLogin(spotifyApiConfig: AccessToken) {
    const transaction = await db.$transaction(
      async (prisma) => {
        const spotify = SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          spotifyApiConfig
        )

        const spotifyUserProfile = await spotify.currentUser.profile()

        let user = await prisma.user.findUnique({
          where: { email: spotifyUserProfile.email },
          select: {
            id: true,
            username: true,
            discoverWeeklyId: true,
            displayName: true,
            spotifyId: true,
            spotifyUri: true,
            pfp: true,
          },
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
            select: {
              id: true,
              username: true,
              discoverWeeklyId: true,
              displayName: true,
              spotifyId: true,
              spotifyUri: true,
              pfp: true,
            },
          })

          const userTrackService = new UserTrackService()

          const discoverWeeklyPlaylists =
            await userTrackService.getUserDiscoverWeeklyPlaylists(
              spotifyApiConfig
            )

          if (discoverWeeklyPlaylists.length === 1) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { discoverWeeklyId: discoverWeeklyPlaylists[0].id },
            })
          }
        }

        // Upsert the Spotify token for the user
        const spotifyToken = {
          accessToken: encrypt(spotifyApiConfig.access_token),
          refreshToken: encrypt(spotifyApiConfig.refresh_token),
          tokenType: spotifyApiConfig.token_type,
          expiresIn: spotifyApiConfig.expires_in,
          userId: user.id,
        }

        await prisma.spotifyToken.upsert({
          where: { userId: user.id },
          update: spotifyToken,
          create: spotifyToken,
        })

        // Create a JWT for the user
        const jwt = createJwt(user.id, spotifyApiConfig.expires_in)

        return {
          wildfire_token: jwt,
          spotify_auth: spotifyApiConfig,
          user,
        }
      },
      {
        timeout: 10000000,
      }
    )

    return transaction
  }
  async signUpOrLoginDemo() {
    const user = await db.user.findUnique({
      where: { email: "dwolfgram@comcast.net" },
      select: {
        id: true,
        username: true,
        discoverWeeklyId: true,
        displayName: true,
        spotifyId: true,
        spotifyUri: true,
        pfp: true,
      },
    })

    if (!user) {
      throw new Error("No demo user found")
    }

    const spotifyToken = await db.spotifyToken.findUnique({
      where: {
        userId: user.id,
      },
    })

    if (!spotifyToken) {
      throw new Error("No demo spotify tokens found")
    }

    // demo jwt
    const jwt = "DEMO"

    return {
      wildfire_token: jwt,
      spotify_auth: formatSpotifyToken(spotifyToken),
      user,
    }
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
  async refreshForSpotifyOnFrontend(refreshToken: string) {
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

      return response.data
    } catch (error) {
      console.error(error)
      throw new UnauthorizedError("Unable to refresh access tokens.")
    }
  }
}
