import API_VERSION from "@/utils/version"
import BaseRouter from "@/common/base-router"
import { UserTrackController } from "./user-track.controller"
import { UserTrackService } from "./user-track.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class UserTrackRouter extends BaseRouter<UserTrackController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/user-tracks/wildfire-weekly`,
      spotifyAuthMiddleware,
      this.controller.getWildfireWeekly
    )
    this.router.get(
      `${API_VERSION}/user-tracks/discover-weekly-playlists`,
      spotifyAuthMiddleware,
      this.controller.getUserDiscoverWeeklyPlaylists
    )
    this.router.get(
      `${API_VERSION}/user-tracks/:userId`,
      spotifyAuthMiddleware,
      this.controller.getUserTracksByType
    )
  }
}

export default new UserTrackRouter({
  controller: new UserTrackController({
    services: {
      userTrackService: new UserTrackService(),
    },
  }),
}).getRouter()
