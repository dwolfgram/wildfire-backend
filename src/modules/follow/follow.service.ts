import db from "@/lib/db"
import { Follow, User } from "@prisma/client"
import { NotificationService } from "../notifications/notification.service"

export class FollowService {
  followUser = async (
    authUser: User,
    userToFollowId: string
  ): Promise<Follow> => {
    try {
      if (authUser.id === userToFollowId) {
        throw new Error("You cannot follow yourself.")
      }

      const existingFollow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: authUser.id,
            followingId: userToFollowId,
          },
        },
      })

      if (existingFollow) {
        throw new Error("You are already following this user.")
      }

      const follow = await db.follow.create({
        data: {
          followerId: authUser.id,
          followingId: userToFollowId,
          accepted: true,
        },
      })

      const notificationService = new NotificationService()
      await notificationService.sendNotification({
        toUserId: userToFollowId,
        fromUserId: authUser.id,
        title: `@${authUser.username}`,
        message: `just followed you`,
        type: "NEW_FOLLOWER",
      })

      return follow
    } catch (error) {
      console.error("Error following user:", error)
      throw new Error("Unable to follow user")
    }
  }
  unfollowUser = async (userId: string, userToUnfollowId: string) => {
    try {
      const followRelationship = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: userToUnfollowId,
          },
        },
      })

      if (!followRelationship) {
        throw new Error("Follow relationship does not exist")
      }

      await db.follow.delete({
        where: {
          id: followRelationship.id,
        },
      })

      return { success: true }
    } catch (err) {
      console.error("Error following user:", err)
      throw new Error("Unable to follow user")
    }
  }
  getFollowers = async (authUserId: string, userId: string) => {
    try {
      const followersWithStatus = await db.user.findUnique({
        where: { id: userId },
        select: {
          followers: {
            select: {
              follower: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  pfp: true,
                  followers: {
                    where: {
                      followerId: authUserId,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return followersWithStatus?.followers.map((follow) => ({
        ...follow.follower,
        isFollowingBack: follow.follower.followers.length > 0,
      }))
    } catch (err) {
      console.error("Error fetching followers:", err)
      throw new Error("Unable to fetch followers")
    }
  }
  getFollowing = async (authUserId: string, userId: string) => {
    try {
      const followingWithStatus = await db.user.findUnique({
        where: { id: userId },
        select: {
          following: {
            select: {
              following: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  pfp: true,
                  followers: {
                    where: {
                      followerId: authUserId,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      return followingWithStatus?.following.map((follow) => ({
        ...follow.following,
        isFollowingBack: true,
      }))
    } catch (err) {
      console.error("Error fetching following:", err)
      throw new Error("Unable to fetch following")
    }
  }
}
