import { decrypt } from "@/lib/encrypt"
import { SpotifyToken } from "@prisma/client"
import { AccessToken } from "@spotify/web-api-ts-sdk"

export const formatSpotifyToken = (dbToken: SpotifyToken): AccessToken => {
  return {
    access_token: decrypt(dbToken.accessToken),
    refresh_token: decrypt(dbToken.refreshToken),
    expires_in: dbToken.expiresIn,
    token_type: dbToken.tokenType,
  }
}
