import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { SongService } from "./song.service"
import { asyncHandler } from "@/utils/asyncHandler"
import { Song, SongHistory } from "@prisma/client"

export class SongController extends BaseController<{
  songService: SongService
}> {
  sendSong = asyncHandler(async (req: Request, res: Response) => {
    const { song, toUserIds, userIdToCredit } = req.body

    const data = await Promise.all(
      toUserIds.map((toUserId: string) => {
        return this.services.songService.sendSong(
          {
            ...song,
            senderId: req.user.id,
            receiverId: toUserId,
          },
          userIdToCredit
        )
      })
    )

    return res.send(data)
  })
}
