import { NextFunction, Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { AuthService } from "./auth.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class AuthController extends BaseController<{
  authService: AuthService
}> {
  swapCodeForTokens = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { code, redirectUri } = req.body
      const data = await this.services.authService.swapCodeForTokens(
        code,
        redirectUri
      )
      return res.send(data)
    }
  )
  signUpOrLogin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { spotifyData } = req.body
      const data = await this.services.authService.signUpOrLogin(spotifyData)
      return res.send(data)
    }
  )
  signUpOrLoginDemo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.services.authService.signUpOrLoginDemo()
      return res.send(data)
    }
  )
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    const data = await this.services.authService.refreshToken(refreshToken)

    return res.send(data)
  })
  refreshForSpotifyOnFrontend = asyncHandler(
    async (req: Request, res: Response) => {
      const { refresh_token } = req.body
      const data = await this.services.authService.refreshForSpotifyOnFrontend(
        refresh_token
      )

      return res.send(data)
    }
  )
}
