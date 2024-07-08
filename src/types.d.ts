import { User } from "@prisma/client"
import { AccessToken } from "@spotify/web-api-ts-sdk"

declare global {
  namespace Express {
    interface Request {
      user: User
      spotifyApiConfig: AccessToken
    }
  }
}
