import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export const createJwt = (userId: string, expiresIn: number) => {
  const jwtPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (expiresIn || 3600),
  }
  const jwtToken = jwt.sign(jwtPayload, JWT_SECRET)

  return jwtToken
}

export const validateJwt = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string
    roles: string[]
    exp: number
    iat: number
  }
}
