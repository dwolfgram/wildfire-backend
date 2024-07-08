type Services = {
  [key: string]: any
}

abstract class BaseController<T extends Services> {
  protected services: T

  constructor({ services }: { services: T }) {
    this.services = services
  }
}

export default BaseController
