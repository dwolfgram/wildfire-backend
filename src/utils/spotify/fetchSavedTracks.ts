import { AccessToken, SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk"
import { wait } from "../wait"
import { withSpotifyApi } from "../withSpotifyApi"

export const fetchAllLikedTracks = async (
  spotifyConfig: AccessToken,
  delayBetweenReq: number = 500
) =>
  withSpotifyApi(
    spotifyConfig,
    async (spotify: SpotifyApi) => {
      let allTracks: SavedTrack[] = []
      let offset = 0
      let total = 0
      let limit: 50 = 50

      while (true) {
        const {
          items,
          total: fetchedTotal,
          next,
        } = await spotify.currentUser.tracks.savedTracks(limit, offset)

        allTracks = [...allTracks, ...items]
        offset += limit
        total = fetchedTotal

        if (!next || allTracks.length >= total) break

        await wait(delayBetweenReq)
      }

      return allTracks
    },
    true
  )

export const fetchSavedTracksUpToDate = async (
  cutOffDate: Date,
  spotifyConfig: AccessToken
) =>
  withSpotifyApi(
    spotifyConfig,
    async (spotify: SpotifyApi) => {
      const cutoff = new Date(cutOffDate)
      if (isNaN(cutoff.getTime())) {
        throw new Error(
          "Invalid date format. Please provide a valid ISO date string."
        )
      }

      let allTracks: SavedTrack[] = []
      let offset = 0
      let hasMoreTracks = true
      let limit: 50 = 50

      while (hasMoreTracks) {
        const { items, total, next } =
          await spotify.currentUser.tracks.savedTracks(limit, offset)
        offset += limit
        const filteredTracks = items.filter(
          ({ added_at }) => new Date(added_at) >= cutoff
        )
        if (filteredTracks.length === 0) {
          hasMoreTracks = false
        }
        allTracks = [...allTracks, ...filteredTracks]
        if (!next) {
          hasMoreTracks = false
        }
      }

      return allTracks
    },
    true
  )
