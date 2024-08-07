import db from "@/lib/db"
import { expo } from "@/utils/expo-notifications"
import { NotificationType } from "@prisma/client"
import Expo, { ExpoPushMessage } from "expo-server-sdk"

interface CreateNotification {
  toUserId: string
  title: string
  message: string
  type: NotificationType
  fromUserId?: string
  data?: Record<string, any>
  saveToDb?: boolean
  songId?: string
}

export class NotificationService {
  sendNotification = async ({
    toUserId,
    fromUserId,
    title,
    message,
    data,
    type,
    songId,
    saveToDb = true,
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
          priority: "high",
          sound: "default",
        } as ExpoPushMessage

        await expo.sendPushNotificationsAsync([notification])
      }
      if (saveToDb) {
        await db.notification.create({
          data: {
            senderId: fromUserId,
            userId: toUserId,
            message,
            type,
            songId,
          },
        })
      }
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
          sender: {
            select: {
              username: true,
              pfp: true,
            },
          },
          song: {
            select: {
              name: true,
              albumImage: true,
              artistName: true,
              conversationId: true,
              receiver: {
                select: {
                  username: true,
                },
              },
            },
          },
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

    const notifications: ExpoPushMessage[] = []

    for (const user of validUsers) {
      if (!Expo.isExpoPushToken(user.notificationToken)) {
        console.error(
          `Push token ${user.notificationToken} is not a valid Expo push token`
        )
        continue
      }

      notifications.push({
        to: user.notificationToken!,
        title: `@${user.username}`,
        body: "new wildfire weekly is now available",
        data: {
          type: "ALERT",
        },
        priority: "high",
        sound: "default",
      })
    }

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
