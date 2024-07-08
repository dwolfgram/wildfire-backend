import API_VERSION from "@/utils/version"
import { NextFunction, Request, Response } from "express"
import BaseController from "@/common/base-controller"
import { AuthService } from "./auth.service"
import { asyncHandler } from "@/utils/asyncHandler"

export class AuthController extends BaseController<{
  authService: AuthService
}> {
  signUpOrLogin = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { code, redirectUri } = req.body
      const data = await this.services.authService.signUpOrLogin(
        code,
        redirectUri
      )

      return res.send(data)
    }
  )

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    const data = await this.services.authService.refreshToken(refreshToken)

    return res.send(data)
  })
}
