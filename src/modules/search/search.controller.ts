import API_VERSION from "@/utils/version"
import { Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { SearchService } from "./search.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class SearchController extends BaseController<{
  searchService: SearchService
}> {
  searchTracks = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query
    const data = await this.services.searchService.searchTracks(
      query as string,
      req.spotifyApiConfig
    )

    return res.send(data)
  })

  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query
    const data = await this.services.searchService.searchUsers(query as string)

    return res.send(data)
  })
}
