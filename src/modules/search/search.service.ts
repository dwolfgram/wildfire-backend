import db from "@/lib/db"
import { withSpotifyApi } from "@/utils/withSpotifyApi"
import { User } from "@prisma/client"
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"

export class SearchService {
  searchTracks = async (query: string, spotifyConfig: AccessToken) => {
    return withSpotifyApi(spotifyConfig, async (spotify: SpotifyApi) => {
      try {
        const results = await spotify.search(query, ["track"], undefined, 20)

        return results
      } catch (error) {
        console.error("Error updating user:", error)
        throw new Error("Unable to update user")
      }
    })
  }
  searchUsers = async (query: string): Promise<User[]> => {
    try {
      const users = await db.user.findMany({
        where: {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
        orderBy: [
          {
            username: "asc",
          },
        ],
      })
      return users
    } catch (error) {
      console.error("Error search for users:", error)
      throw new Error("Unable to search for users. Try again.")
    }
  }
}
