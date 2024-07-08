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
  withSpotifyApi(spotifyConfig, async (spotify: SpotifyApi) => {
    let allTracks: (Track | PlaylistedTrack<TrackItem>)[] = []
    let offset = 0
    let total = 0
    let limit: 50 = 50

    while (true) {
      const { items, total: fetchedTotal } = await spotify.currentUser.topItems(
        "tracks",
        "short_term",
        limit,
        offset
      )

      allTracks = [...allTracks, ...items]
      offset += limit
      total = fetchedTotal

      if (allTracks.length >= total) break

      await wait(200)
    }

    return allTracks
  })
