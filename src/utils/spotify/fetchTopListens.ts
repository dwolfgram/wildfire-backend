import {
  AccessToken,
  PlaylistedTrack,
  SpotifyApi,
  Track,
  TrackItem,
} from "@spotify/web-api-ts-sdk"
import { wait } from "../wait"
import { withSpotifyApi } from "../withSpotifyApi"

export const fetchSpotifyTopListens = async (spotifyConfig: AccessToken) =>
  withSpotifyApi(
    spotifyConfig,
    async (spotify: SpotifyApi) => {
      let allTracks: (Track | PlaylistedTrack<TrackItem>)[] = []
      const limit = 50

      for (let i = 0; i < 2; i++) {
        const offset = i * limit
        const { items } = await spotify.currentUser.topItems(
          "tracks",
          "short_term",
          limit,
          offset
        )

        allTracks = [...allTracks, ...items]
        await wait(500)
      }

      return allTracks
    },
    true
  )
