import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { ConversationService } from "./conversation.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class ConversationController extends BaseController<{
  conversationService: ConversationService
}> {
  getAllUserConversations = asyncHandler(
    async (req: Request, res: Response) => {
      const data =
        await this.services.conversationService.getAllUserConversations(
          req.user.id
        )

      return res.send(data)
    }
  )
  getConversationById = asyncHandler(async (req: Request, res: Response) => {
    const { id: conversationId } = req.params
    const data = await this.services.conversationService.getConversationById(
      req.user.id,
      conversationId
    )

    return res.send(data)
  })
  markSongsAsSeen = asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.body

    const data = await this.services.conversationService.markSongsAsSeen(
      req.user.id,
      conversationId
    )

    return res.send(data)
  })
}
