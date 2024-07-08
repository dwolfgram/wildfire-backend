import API_VERSION from "@/utils/version"
import BaseRouter from "@/common/base-router"
import { SongController } from "./song.controller"
import { SongService } from "./song.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class SongRouter extends BaseRouter<SongController> {
  protected initializedRoutes(): void {
    this.router.post(
      `${API_VERSION}/song/send`,
      spotifyAuthMiddleware,
      this.controller.sendSong
    )
  }
}

export default new SongRouter({
  controller: new SongController({
    services: {
      songService: new SongService(),
    },
  }),
}).getRouter()
