import { Router } from "express"

abstract class BaseRoutes<T> {
  protected router: Router = Router()

  protected controller: T

  constructor({ controller }: { controller: T }) {
    this.controller = controller
    this.initializedRoutes()
  }

  protected abstract initializedRoutes(): void

  public getRouter(): Router {
    return this.router
  }
}

export default BaseRoutes
