import db from "@/lib/db"
import { isErrorWithMessage } from "@/utils/isErrorWithMessage"
import { withSpotifyApi } from "@/utils/withSpotifyApi"
import { AccessToken } from "@spotify/web-api-ts-sdk"
import dotenv from "dotenv"

dotenv.config()

export class SpotifyService {
  playSong = async (
    spotifyConfig: AccessToken,
    songUri: string,
    deviceId: string,
    position: number
  ) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      console.log("deviceId", deviceId)
      try {
        await spotify.player.startResumePlayback(
          deviceId,
          undefined,
          !position ? [songUri] : undefined,
          undefined,
          position
        )
        return { success: true }
      } catch (error) {
        if (
          isErrorWithMessage(error) &&
          error.message.toLowerCase().includes("unexpected token")
        ) {
          return { success: true }
        }
        console.error("Error playing song:", error)
        throw new Error("Unable to play song")
      }
    })
  pauseSong = async (spotifyConfig: AccessToken, deviceId: string) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        console.log("DEVICEID", deviceId)
        await spotify.player.pausePlayback(deviceId)
        return { success: true }
      } catch (error) {
        if (
          isErrorWithMessage(error) &&
          (error.message.toLowerCase().includes("unexpected token") ||
            error.message.toLowerCase().includes("syntaxerror") ||
            error.message.toLowerCase().includes("bad Oauth request"))
        ) {
          return { success: true }
        }
        console.error("Error pausing song:", error)
        throw new Error("Unable to pause song")
      }
    })
  getDeviceList = async (spotifyConfig: AccessToken) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        const data = await spotify.player.getAvailableDevices()
        return data.devices
      } catch (error) {
        console.error("Error getting devices:", error)
        throw new Error("Unable to get devices")
      }
    })
  getTrackById = async (spotifyConfig: AccessToken, trackId: string) =>
    withSpotifyApi(spotifyConfig, async (spotify) => {
      try {
        const data = await spotify.tracks.get(trackId)
        return data
      } catch (error) {
        console.error("Error getting devices:", error)
        throw new Error("Unable to get devices")
      }
    })
}
