import db from "@/lib/db"
import { filterDuplicates } from "@/utils/filterDuplicates"
import { getOneWeekAgoDate } from "@/utils/getOneWeekAgo"
import {
  fetchDiscoverWeeklyPlaylists,
  fetchDiscoverWeeklyTracks,
} from "@/utils/spotify/fetchDiscoverWeekly"
import {
  fetchAllLikedTracks,
  fetchSavedTracksUpToDate,
} from "@/utils/spotify/fetchSavedTracks"
import { fetchSpotifyTopListens } from "@/utils/spotify/fetchTopListens"
import { PrismaClient, TrackType } from "@prisma/client"
import { QueryOptions } from "@prisma/client/runtime/library"
import { AccessToken, SavedTrack, Track } from "@spotify/web-api-ts-sdk"

export class UserTrackService {
  getWildfireWeekly = async (userId: string) => {
    const oneWeekAgo = getOneWeekAgoDate()
    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        createdInitialTracksAt: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const userTracks = await db.song.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: userId,
            },
          },
          createdAt: {
            lt: oneWeekAgo,
          },
        },
        AND: [
          {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
          {
            createdAt: {
              gte: user.createdInitialTracksAt || oneWeekAgo,
            },
          },
        ],
        OR: [
          {
            trackType: "SAVED_TRACK",
          },
          {
            trackType: "TOP_LISTEN",
          },
        ],
      },
      include: {
        user: true,
      },
    })

    return userTracks
  }
  getUserTracksByType = async (
    userId: string,
    trackType: TrackType,
    options: { page: number; limit: number }
  ) => {
    try {
      const tracks = await db.song.findMany({
        where: {
          userId,
          ...(trackType === TrackType.SAVED_TRACK
            ? {
                OR: [
                  { trackType: TrackType.SAVED_TRACK },
                  { trackType: TrackType.WILDFIRE_LIKE },
                ],
              }
            : { trackType }),
        },
        distinct: ["spotifyId"],
        include: {
          history: {
            select: {
              id: true,
              sender: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
              user: {
                select: {
                  id: true,
                  username: true,
                  pfp: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              pfp: true,
            },
          },
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: {
          createdAt: trackType === TrackType.TOP_LISTEN ? "asc" : "desc",
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

      const savedTracks = await txDbClient.song.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return savedTracks
    } catch (error) {
      console.error("Error getting spotify likes:", error)
      throw new Error("Unable to get spotify likes")
    }
  }
  getAndStoreSpotifyLikesAfterDdate = async (
    userId: string,
    cutOffDate: Date,
    spotifyConfig: AccessToken,
    txDbClient: PrismaClient = db
  ) => {
    try {
      const likedTracks = await fetchSavedTracksUpToDate(
        cutOffDate,
        spotifyConfig
      )

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

      const savedTracks = await txDbClient.song.createMany({
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
        createdAt: new Date(),
      }))

      const savedTracks = await txDbClient.song.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return savedTracks
    } catch (error) {
      console.error("Error getting spotify top listens:", error)
      throw new Error("Unable to get spotify top listens")
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

      const discoverSongs = await txDbClient.song.createMany({
        data: trackData,
        skipDuplicates: true,
      })

      return discoverSongs
    } catch (error) {
      console.error("Error getting spotify discover weekly:", error)
      throw new Error("Unable to get spotify discover weekly songs")
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
