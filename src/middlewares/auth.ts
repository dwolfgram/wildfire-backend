import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { UnauthorizedError } from "@/errors/unauthorizedError"
import db from "@/lib/db"
import { formatSpotifyToken } from "@/utils/formatSpotifyToken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

const spotifyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No access token provided."))
  }

  const token = authHeader.split(" ")[1]

  try {
    // if (token.toLowerCase() === "demo") {
    //   const { user, tokenRecord } = await handleDemoAccount()
    //   req.user = user
    //   req.spotifyApiConfig = formatSpotifyToken(tokenRecord)
    //   return next()
    // }
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      roles: string[]
      exp: number
      iat: number
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return next(new UnauthorizedError("User not found."))
    }

    const tokenRecord = await db.spotifyToken.findUnique({
      where: { userId: user.id },
    })

    if (!tokenRecord) {
      throw new Error("Spotify tokens not found for user.")
    }

    req.user = user
    req.spotifyApiConfig = formatSpotifyToken(tokenRecord)
    return next()
  } catch (error) {
    // console.log("auth error:", error)
    console.log("Error with token:", token)
    return next(new UnauthorizedError("Invalid access token."))
  }
}

const handleDemoAccount = async () => {
  const user = await db.user.findUnique({
    where: { email: "dwolfgram@comcast.net" },
  })

  if (!user) {
    throw new UnauthorizedError("User not found.")
  }

  const tokenRecord = await db.spotifyToken.findUnique({
    where: { userId: user.id },
  })

  if (!tokenRecord) {
    throw new Error("Spotify tokens not found for user.")
  }

  return { user, tokenRecord }
}

export default spotifyAuthMiddleware
