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
    this.router.get(
      `${API_VERSION}/song/history`,
      spotifyAuthMiddleware,
      this.controller.getSongHistory
    )
    this.router.get(
      `${API_VERSION}/song/likes`,
      spotifyAuthMiddleware,
      this.controller.getUserLikedSongIds
    )
    this.router.post(
      `${API_VERSION}/song/like`,
      spotifyAuthMiddleware,
      this.controller.likeSong
    )
    this.router.post(
      `${API_VERSION}/song/unlike`,
      spotifyAuthMiddleware,
      this.controller.unlikeSong
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
