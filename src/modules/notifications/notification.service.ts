import db from "@/lib/db"
import { expo } from "@/utils/expo-notifications"
import { withSpotifyApi } from "@/utils/withSpotifyApi"
import { NotificationType, User } from "@prisma/client"
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk"
import Expo, { ExpoPushMessage } from "expo-server-sdk"

interface CreateNotification {
  toUserId: string
  title: string
  message: string
  fromUserId?: string
  data?: Record<string, any>
  type: NotificationType
}

export class NotificationService {
  sendNotification = async ({
    toUserId,
    fromUserId,
    title,
    message,
    data,
    type,
  }: CreateNotification) => {
    try {
      const user = await db.user.findUnique({
        where: {
          id: toUserId,
        },
        select: {
          notificationToken: true,
        },
      })
      if (user?.notificationToken) {
        const notification = {
          to: user.notificationToken,
          body: message,
          title,
          data: {
            ...data,
            fromUserId,
            type,
          },
          priority: "normal",
        } as ExpoPushMessage

        await expo.sendPushNotificationsAsync([notification])
      }

      await db.notification.create({
        data: {
          senderId: fromUserId,
          userId: toUserId,
          message,
          type,
        },
      })
    } catch (err) {
      console.log("Error sending notification", err)
      throw new Error("Error sending notification")
    }
  }
  getUnreadNotificationCount = async (userId: string) => {
    try {
      const count = await db.notification.count({
        where: {
          userId: userId,
          seen: false,
        },
      })

      return { count }
    } catch (err) {
      console.log("Error fetching unread notification count", err)
      throw new Error("Error fetching unread notification count")
    }
  }
  getUserNotifications = async (
    userId: string,
    options: { page: number; limit: number }
  ) => {
    try {
      const notifications = await db.notification.findMany({
        where: {
          userId: userId,
        },
        include: {
          sender: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      })

      return notifications
    } catch (err) {
      console.log("Error fetching notifications", err)
      throw new Error("Error fetching notifications")
    }
  }
  markNotificationsAsSeen = async (authUserId: string) => {
    try {
      await db.notification.updateMany({
        where: { userId: authUserId },
        data: { seen: true },
      })
      return { success: true }
    } catch (err) {
      throw new Error("Unable to mark conversation as seen")
    }
  }
  sendAllUsersWildfireWeeklyNotification = async () => {
    const validUsers = await db.user.findMany({
      where: {
        notificationToken: {
          not: null,
        },
      },
      select: {
        id: true,
        notificationToken: true,
        username: true,
      },
    })

    for (const user of validUsers) {
      if (!Expo.isExpoPushToken(user.notificationToken)) {
        console.error(
          `Push token ${user.notificationToken} is not a valid Expo push token`
        )
        continue
      }

      const notifications = validUsers.map((user) => ({
        to: user.notificationToken!,
        title: `@${user.username}`,
        body: "new wildfire weekly is now available",
        data: {
          type: "ALERT",
        },
        priority: "normal",
      })) as ExpoPushMessage[]

      const chunks = expo.chunkPushNotifications(notifications)
      for (let chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }
}