import API_VERSION from "@/utils/version"
import BaseRouter from "@/common/base-router"
import { SpotifyController } from "./spotify.controller"
import { SpotifyService } from "./spotify.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class SpotifyRouter extends BaseRouter<SpotifyController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/spotify/devices`,
      spotifyAuthMiddleware,
      this.controller.getDeviceList
    )
    this.router.put(
      `${API_VERSION}/spotify/start-resume`,
      spotifyAuthMiddleware,
      this.controller.playSong
    )
    this.router.put(
      `${API_VERSION}/spotify/pause`,
      spotifyAuthMiddleware,
      this.controller.pauseSong
    )
    this.router.get(
      `${API_VERSION}/spotify/track`,
      spotifyAuthMiddleware,
      this.controller.getTrack
    )
  }
}

export default new SpotifyRouter({
  controller: new SpotifyController({
    services: {
      spotifyService: new SpotifyService(),
    },
  }),
}).getRouter()
