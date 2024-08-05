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
  withSpotifyApi(
    spotifyConfig,
    async (spotify: SpotifyApi) => {
      let allTracks: PlaylistedTrack<Track>[] = []
      let offset = 0
      let total = 0
      let limit: 50 = 50

      while (true) {
        const {
          items,
          total: fetchedTotal,
          next,
        } = await spotify.playlists.getPlaylistItems(
          playlistId,
          undefined,
          undefined,
          limit,
          offset
        )

        allTracks = [...allTracks, ...items]
        offset += limit
        total = fetchedTotal

        if (!next || allTracks.length >= total) break

        await wait(500)
      }

      return allTracks
    },
    true
  )

export const fetchDiscoverWeeklyPlaylists = async (
  spotifyConfig: AccessToken
) =>
  withSpotifyApi(spotifyConfig, async (spotify: SpotifyApi) => {
    let allPlaylists: SimplifiedPlaylist[] = []
    let offset = 0
    let total = 0
    let limit: 50 = 50

    while (true) {
      const {
        items,
        total: fetchedTotal,
        next,
      } = await spotify.currentUser.playlists.playlists(limit, offset)

      allPlaylists = [...allPlaylists, ...items]
      offset += limit
      total = fetchedTotal

      console.log("Total to fetch: ", fetchedTotal)
      console.log("Currently at: ", offset)
      console.log("Tracks processed: ", allPlaylists.length)
      console.log("has next page:", Boolean(next))

      if (!next || allPlaylists.length >= total) break
      await wait(300)
    }

    const discoverWeeklyPlaylists = allPlaylists.filter((playlist) =>
      playlist.name.toLowerCase().includes("discover weekly")
    )

    return discoverWeeklyPlaylists
  })
