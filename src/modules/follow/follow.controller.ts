import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { FollowService } from "./follow.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class FollowController extends BaseController<{
  followService: FollowService
}> {
  followUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId: userToFollowId } = req.body
    const data = await this.services.followService.followUser(
      req.user.id,
      userToFollowId as string
    )

    return res.send(data)
  })
  unfollowUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId: userToFollowId } = req.body
    const data = await this.services.followService.unfollowUser(
      req.user.id,
      userToFollowId as string
    )

    return res.send(data)
  })
  getFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query
    const data = await this.services.followService.getFollowers(
      req.user.id,
      userId as string
    )

    return res.send(data)
  })
  getFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query
    const data = await this.services.followService.getFollowing(
      req.user.id,
      userId as string
    )

    return res.send(data)
  })
}
