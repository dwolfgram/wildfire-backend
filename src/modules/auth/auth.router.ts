import API_VERSION from "@/utils/version"
import BaseController from "@/common/base-controller"
import BaseRouter from "@/common/base-router"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

class AuthRouter extends BaseRouter<AuthController> {
  protected initializedRoutes(): void {
    this.router.post(
      `${API_VERSION}/auth/token-swap`,
      this.controller.swapCodeForTokens
    )
    this.router.post(`${API_VERSION}/auth/login`, this.controller.signUpOrLogin)
    this.router.post(
      `${API_VERSION}/auth/login/demo`,
      this.controller.signUpOrLoginDemo
    )
    this.router.post(
      `${API_VERSION}/auth/refresh-token`,
      this.controller.refreshToken
    )
    this.router.post(
      `${API_VERSION}/auth/refresh-token-frontend`,
      this.controller.refreshForSpotifyOnFrontend
    )
  }
}

export default new AuthRouter({
  controller: new AuthController({
    services: {
      authService: new AuthService(),
    },
  }),
}).getRouter()
