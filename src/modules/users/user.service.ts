import db from "@/lib/db"
import { User } from "@prisma/client"

export class UserService {
  updateUser = async (
    userId: string,
    updatedUser: Partial<User>
  ): Promise<User | null> => {
    try {
      if (updatedUser.username) {
        updatedUser.username = updatedUser.username.toLowerCase()
      }
      const updated = await db.user.update({
        where: {
          id: userId,
        },
        data: updatedUser,
      })
      return updated
    } catch (error) {
      console.error("Error updating user:", error)
      throw new Error("Unable to update user")
    }
  }
  getUserProfile = async (
    authUserId: string,
    userId: string
  ): Promise<Partial<User & { isFollowing: boolean }> | null> => {
    try {
      const profile = await db.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          username: true,
          displayName: true,
          pfp: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      })

      const isFollowing = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: authUserId,
            followingId: userId,
          },
        },
      })

      return {
        ...profile,
        isFollowing: !!isFollowing,
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw new Error("Unable to fetch user profile")
    }
  }
}
