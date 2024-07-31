import API_VERSION from "@/utils/version"
import BaseRouter from "@/common/base-router"
import { UserController } from "./user.controller"
import { UserService } from "./user.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class UserRouter extends BaseRouter<UserController> {
  protected initializedRoutes(): void {
    this.router.patch(
      `${API_VERSION}/user/update`,
      spotifyAuthMiddleware,
      this.controller.updateUser
    )
    this.router.get(
      `${API_VERSION}/user/profile`,
      spotifyAuthMiddleware,
      this.controller.getUserProfile
    )
    this.router.get(
      `${API_VERSION}/user/me`,
      spotifyAuthMiddleware,
      this.controller.getCurrentUser
    )
  }
}

export default new UserRouter({
  controller: new UserController({
    services: {
      userService: new UserService(),
    },
  }),
}).getRouter()
