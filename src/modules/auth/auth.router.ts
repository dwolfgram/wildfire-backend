import API_VERSION from "@/utils/version"
import BaseController from "@/common/base-controller"
import BaseRouter from "@/common/base-router"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

class AuthRouter extends BaseRouter<AuthController> {
  protected initializedRoutes(): void {
    this.router.post(
      `${API_VERSION}/auth/token_swap`,
      this.controller.signUpOrLogin
    )
    this.router.post(
      `${API_VERSION}/auth/refresh_token`,
      this.controller.refreshToken
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
