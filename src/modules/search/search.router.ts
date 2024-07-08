import API_VERSION from "@/utils/version"
import BaseController from "@/common/base-controller"
import BaseRouter from "@/common/base-router"
import { SearchController } from "./search.controller"
import { SearchService } from "./search.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class SearchRouter extends BaseRouter<SearchController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/search/tracks`,
      spotifyAuthMiddleware,
      this.controller.searchTracks
    )
    this.router.get(
      `${API_VERSION}/search/users`,
      spotifyAuthMiddleware,
      this.controller.searchUsers
    )
  }
}

export default new SearchRouter({
  controller: new SearchController({
    services: {
      searchService: new SearchService(),
    },
  }),
}).getRouter()
