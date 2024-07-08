import { AuthService } from "@/modules/auth/auth.service"
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"
import dotenv from "dotenv"

dotenv.config()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string

type SpotifyApiCall<T> = (spotify: SpotifyApi) => Promise<T>

const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  )
}

export const withSpotifyApi = async <T>(
  spotifyConfig: AccessToken,
  apiCall: SpotifyApiCall<T>
): Promise<T> => {
  const spotify = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, spotifyConfig)

  try {
    return await apiCall(spotify)
  } catch (error) {
    if (
      isErrorWithMessage(error) &&
      error.message.toLowerCase().includes("bad or expired token")
    ) {
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
    } else {
      throw error
    }
  }
}