import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { NotificationService } from "./notification.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class NotificationController extends BaseController<{
  notificationService: NotificationService
}> {
  getUnreadNotificationCount = asyncHandler(
    async (req: Request, res: Response) => {
      const data =
        await this.services.notificationService.getUnreadNotificationCount(
          req.user.id
        )

      return res.send(data).status(200)
    }
  )
  getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query
    const data = await this.services.notificationService.getUserNotifications(
      req.user.id,
      { page: parseInt(page as string), limit: parseInt(limit as string) }
    )

    return res.send(data)
  })
  markNotificationsAsSeen = asyncHandler(
    async (req: Request, res: Response) => {
      const data =
        await this.services.notificationService.markNotificationsAsSeen(
          req.user.id
        )

      return res.send(data)
    }
  )
}
