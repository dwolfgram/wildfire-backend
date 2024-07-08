import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { UserTrackService } from "./user-track.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class UserTrackController extends BaseController<{
  userTrackService: UserTrackService
}> {
  getUserTracksByType = asyncHandler(async (req: Request, res: Response) => {
    const { trackType } = req.query
    const { userId } = req.params
    const data = await this.services.userTrackService.getUserTracksByType(
      userId,
      trackType as any
    )

    return res.send(data)
  })
  getUserDiscoverWeeklyPlaylists = asyncHandler(
    async (req: Request, res: Response) => {
      const data =
        await this.services.userTrackService.getUserDiscoverWeeklyPlaylists(
          req.spotifyApiConfig
        )

      return res.send(data)
    }
  )
}
