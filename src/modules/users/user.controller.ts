import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { UserService } from "./user.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class UserController extends BaseController<{
  userService: UserService
}> {
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.user
    const updates = req.body
    const data = await this.services.userService.updateUser(id, updates)

    return res.send(data)
  })
  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query
    const data = await this.services.userService.getUserProfile(
      req.user.id,
      userId as string
    )

    return res.send(data)
  })
}
