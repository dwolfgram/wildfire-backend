import {
  AccessToken,
  PlaylistedTrack,
  SimplifiedPlaylist,
  SpotifyApi,
  Track,
} from "@spotify/web-api-ts-sdk"
import { wait } from "../wait"
import { withSpotifyApi } from "../withSpotifyApi"

export const fetchDiscoverWeeklyTracks = async (
  playlistId: string,
  spotifyConfig: AccessToken
) =>
  withSpotifyApi(spotifyConfig, async (spotify: SpotifyApi) => {
    let allTracks: PlaylistedTrack<Track>[] = []
    let offset = 0
    let total = 0
    let limit: 50 = 50

    while (true) {
      const { items, total: fetchedTotal } =
        await spotify.playlists.getPlaylistItems(
          playlistId,
          undefined,
          undefined,
          limit,
          offset
        )

      allTracks = [...allTracks, ...items]
      offset += limit
      total = fetchedTotal

      if (allTracks.length >= total) break

      await wait(500)
    }

    return allTracks
  })

export const fetchDiscoverWeeklyPlaylists = async (
  spotifyConfig: AccessToken
) =>
  withSpotifyApi(spotifyConfig, async (spotify: SpotifyApi) => {
    let allPlaylists: SimplifiedPlaylist[] = []
    let offset = 0
    let total = 0
    let limit: 50 = 50

    while (true) {
      const { items, total: fetchedTotal } =
        await spotify.currentUser.playlists.playlists(limit, offset)

      allPlaylists = [...allPlaylists, ...items]
      offset += limit
      total = fetchedTotal

      if (allPlaylists.length >= total) break
      await wait(200)
    }

    const discoverWeeklyPlaylists = allPlaylists.filter((playlist) =>
      playlist.name.toLowerCase().includes("discover weekly")
    )

    return discoverWeeklyPlaylists
  })
