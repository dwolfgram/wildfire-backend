import { UnauthorizedError } from "@/errors/unauthorizedError"
import { AuthService } from "@/modules/auth/auth.service"
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"
import dotenv from "dotenv"
import { isErrorWithMessage } from "./isErrorWith"
import SpotifyResponseValidator from "./spotifyHandlers/response"

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string

type SpotifyApiCall<T> = (spotify: SpotifyApi) => Promise<T>

export const withSpotifyApi = async <T>(
  spotifyConfig: AccessToken,
  apiCall: SpotifyApiCall<T>,
  shouldRefresh?: boolean
): Promise<T> => {
  const spotify = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, spotifyConfig, {
    responseValidator: new SpotifyResponseValidator(),
  })
  try {
    return await apiCall(spotify)
  } catch (error) {
    if (
      isErrorWithMessage(error) &&
      error.message.toLowerCase().includes("bad or expired token")
    ) {
      if (shouldRefresh) {
        const authService = new AuthService()
        const newTokens = await authService.refreshToken(
          spotifyConfig.refresh_token
        )

        console.log("SPOTIFY TOKEN EXPIRED, RENEWING!")

        const newSpotify = SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          newTokens.spotify_auth
        )

        return await apiCall(newSpotify)
      }
      throw new UnauthorizedError("Spotify token is expired.")
    } else {
      throw error
    }
  }
}
