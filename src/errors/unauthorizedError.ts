import { CustomError, CustomErrorContent } from "./customError"

export class UnauthorizedError extends CustomError {
  readonly statusCode = 401
  readonly errors: CustomErrorContent[]
  readonly logging = true

  constructor(message: string, context?: { [key: string]: any }) {
    super(message)
    this.errors = [{ message, context }]
  }
}
