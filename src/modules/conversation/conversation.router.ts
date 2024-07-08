import API_VERSION from "@/utils/version"
import BaseController from "@/common/base-controller"
import BaseRouter from "@/common/base-router"
import { ConversationController } from "./conversation.controller"
import { ConversationService } from "./conversation.service"
import spotifyAuthMiddleware from "@/middlewares/auth"

class ConversationRouter extends BaseRouter<ConversationController> {
  protected initializedRoutes(): void {
    this.router.get(
      `${API_VERSION}/conversation/all`,
      spotifyAuthMiddleware,
      this.controller.getAllUserConversations
    )
    this.router.get(
      `${API_VERSION}/conversation/:id`,
      spotifyAuthMiddleware,
      this.controller.getConversationById
    )
    this.router.post(
      `${API_VERSION}/conversation/seen`,
      spotifyAuthMiddleware,
      this.controller.markSongsAsSeen
    )
  }
}

export default new ConversationRouter({
  controller: new ConversationController({
    services: {
      conversationService: new ConversationService(),
    },
  }),
}).getRouter()
