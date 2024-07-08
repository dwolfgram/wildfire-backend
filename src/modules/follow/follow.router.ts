import API_VERSION from "@/utils/version"
import BaseRouter from "@/common/base-router"
import { FollowService } from "./follow.service"
import spotifyAuthMiddleware from "@/middlewares/auth"
import { FollowController } from "./follow.controller"

class FollowRouter extends BaseRouter<FollowController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/followers`,
      spotifyAuthMiddleware,
      this.controller.getFollowers
    )
    this.router.get(
      `${API_VERSION}/following`,
      spotifyAuthMiddleware,
      this.controller.getFollowing
    )
    this.router.post(
      `${API_VERSION}/follow`,
      spotifyAuthMiddleware,
      this.controller.followUser
    )
    this.router.post(
      `${API_VERSION}/unfollow`,
      spotifyAuthMiddleware,
      this.controller.unfollowUser
    )
  }
}

export default new FollowRouter({
  controller: new FollowController({
    services: {
      followService: new FollowService(),
    },
  }),
}).getRouter()
