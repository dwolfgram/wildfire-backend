import db from "@/lib/db"
import {
  fetchDiscoverWeeklyPlaylists,
  fetchDiscoverWeeklyTracks,
} from "@/utils/spotify/fetchDiscoverWeekly"
import { fetchAllLikedTracks } from "@/utils/spotify/fetchSavedTracks"
import { fetchSpotifyTopListens } from "@/utils/spotify/fetchTopListens"
import { PrismaClient } from "@prisma/client"
import { AccessToken, SavedTrack, Track } from "@spotify/web-api-ts-sdk"
import dotenv from "dotenv"

enum TrackType {
  SAVED_TRACK = "SAVED_TRACK",
  TOP_LISTEN = "TOP_LISTEN",
  DISCOVER_WEEKLY = "DISCOVER_WEEKLY",
}

export class UserTrackService {
  getUserTracksByType = async (userId: string, trackType: TrackType) => {
    try {
      const tracks = await db.userTrack.findMany({
        where: {
          userId,
          trackType,
        },
      })

      return tracks
    } catch (error) {
      console.error("Error user tracks:", error)
      throw new Error("Unable to get user tracks")
    }
  }
  getAndStoreAllUserSpotifyLikes = async (
    userId: string,
    spotifyConfig: AccessToken,
    txDbClient: PrismaClient = db
  ) => {
    try {
      const likedTracks = await fetchAllLikedTracks(spotifyConfig)

      const trackData = likedTracks.map((track: SavedTrack) => ({
        userId,
        spotifyId: track.track.id,
        albumImage: track.track.album.images[0]?.url || "",
        albumName: track.track.album.name,
        spotifyUri: track.track.uri,
        name: track.track.name,
        artistName: track.track.artists[0].name,
        artistUri: track.track.artists[0].uri,
        durationMs: track.track.duration_ms,
        trackType: TrackType.SAVED_TRACK,
        createdAt: new Date(track.added_at),
      }))

      const savedTracks = await txDbClient.userTrack.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return savedTracks
    } catch (error) {
      console.error("Error getting spotify likes:", error)
      throw new Error("Unable to get spotify likes")
    }
  }
  getAndStoreUsersTopListens = async (
    userId: string,
    spotifyConfig: AccessToken,
    txDbClient: PrismaClient = db
  ) => {
    try {
      const topListens = (await fetchSpotifyTopListens(
        spotifyConfig
      )) as Track[]

      const trackData = topListens.map((track) => ({
        userId,
        spotifyId: track.id,
        albumImage: track.album.images[0]?.url || "",
        albumName: track.album.name,
        spotifyUri: track.uri,
        name: track.name,
        artistName: track.artists[0].name,
        artistUri: track.artists[0].uri,
        durationMs: track.duration_ms,
        trackType: TrackType.TOP_LISTEN,
      }))

      const savedTracks = await txDbClient.userTrack.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return savedTracks
    } catch (error) {
      console.error("Error getting spotify likes:", error)
      throw new Error("Unable to get spotify likes")
    }
  }
  getAndStoreDiscoverWeeklySongs = async (
    userId: string,
    playlistId: string,
    spotifyConfig: AccessToken,
    txDbClient: PrismaClient = db
  ) => {
    try {
      const tracks = await fetchDiscoverWeeklyTracks(playlistId, spotifyConfig)

      const trackData = tracks.map((item) => ({
        userId,
        spotifyId: item.track.id,
        albumImage: item.track.album.images[0]?.url || "",
        albumName: item.track.album.name,
        spotifyUri: item.track.uri,
        name: item.track.name,
        artistName: item.track.artists[0].name,
        artistUri: item.track.artists[0].uri,
        durationMs: item.track.duration_ms,
        trackType: TrackType.DISCOVER_WEEKLY,
      }))

      const discoverSongs = await txDbClient.userTrack.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return discoverSongs
    } catch (error) {
      console.error("Error getting spotify discover weekly:", error)
      throw new Error("Unable to get spotify discover weekly playlists")
    }
  }
  getUserDiscoverWeeklyPlaylists = async (spotifyConfig: AccessToken) => {
    try {
      const playlists = await fetchDiscoverWeeklyPlaylists(spotifyConfig)

      return playlists
    } catch (error) {
      console.error("Error getting spotify discover weekly:", error)
      throw new Error("Unable to get spotify discover weekly playlists")
    }
  }
}
