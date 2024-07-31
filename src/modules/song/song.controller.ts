import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { SongService } from "./song.service"
import { asyncHandler } from "@/utils/asyncHandler"
import { Song } from "@prisma/client"

export class SongController extends BaseController<{
  songService: SongService
}> {
  sendSong = asyncHandler(async (req: Request, res: Response) => {
    const { song, toUserIds, historySongIds } = req.body

    const data = await Promise.all(
      toUserIds.map((toUserId: string) => {
        return this.services.songService.sendSong(
          {
            ...song,
            senderId: req.user.id,
            receiverId: toUserId,
          },
          historySongIds
        )
      })
    )

    return res.send(data)
  })
  getSongHistory = asyncHandler(async (req: Request, res: Response) => {
    const { songId } = req.query
    const data = await this.services.songService.getSongHistoryWithTimeline(
      songId as string
    )

    return res.send(data)
  })
  getUserLikedSongIds = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.services.songService.getUserLikedSongIds(
      req.user.id
    )

    return res.send(data)
  })
  likeSong = asyncHandler(async (req: Request, res: Response) => {
    const { song, historySongIds } = req.body
    const data = await this.services.songService.likeSong(
      req.spotifyApiConfig,
      req.user,
      song,
      historySongIds
    )

    return res.send(data)
  })
  unlikeSong = asyncHandler(async (req: Request, res: Response) => {
    const { spotifyId } = req.body
    const data = await this.services.songService.unlikeSong(
      req.spotifyApiConfig,
      req.user.id,
      spotifyId
    )

    return res.send(data)
  })
}
