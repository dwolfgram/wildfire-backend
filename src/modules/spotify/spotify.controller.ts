import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { SpotifyService } from "./spotify.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class SpotifyController extends BaseController<{
  spotifyService: SpotifyService
}> {
  playSong = asyncHandler(async (req: Request, res: Response) => {
    const { songUri, deviceId, position = 0 } = req.body

    const data = await this.services.spotifyService.playSong(
      req.spotifyApiConfig,
      songUri,
      deviceId,
      position
    )

    return res.send(data)
  })
  pauseSong = asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.body

    const data = await this.services.spotifyService.pauseSong(
      req.spotifyApiConfig,
      deviceId
    )

    return res.send(data)
  })
  getDeviceList = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.services.spotifyService.getDeviceList(
      req.spotifyApiConfig
    )

    return res.send(data)
  })
  getTrack = asyncHandler(async (req: Request, res: Response) => {
    const { trackId } = req.query
    const data = await this.services.spotifyService.getTrackById(
      req.spotifyApiConfig,
      trackId as string
    )

    return res.send(data)
  })
}
