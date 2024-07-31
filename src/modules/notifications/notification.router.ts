import API_VERSION from "@/utils/version"
import BaseController from "@/common/base-controller"
import BaseRouter from "@/common/base-router"
import { NotificationController } from "./notification.controller"
import { NotificationService } from "./notification.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class NotificationRouter extends BaseRouter<NotificationController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/notifications/count`,
      spotifyAuthMiddleware,
      this.controller.getUnreadNotificationCount
    )
    this.router.patch(
      `${API_VERSION}/notifications/seen`,
      spotifyAuthMiddleware,
      this.controller.markNotificationsAsSeen
    )
    this.router.get(
      `${API_VERSION}/notifications`,
      spotifyAuthMiddleware,
      this.controller.getUserNotifications
    )
  }
}

export default new NotificationRouter({
  controller: new NotificationController({
    services: {
      notificationService: new NotificationService(),
    },
  }),
}).getRouter()
