import db from "@/lib/db"

export class ConversationService {
  getAllUserConversations = async (userId: string) => {
    try {
      const conversations = await db.conversation.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: {
          id: true,
          userAId: true,
          userBId: true,
          userA: {
            select: {
              id: true,
              displayName: true,
              username: true,
              pfp: true,
            },
          },
          userB: {
            select: {
              id: true,
              username: true,
              displayName: true,
              pfp: true,
            },
          },
          createdAt: true,
          lastMessageAt: true,
          _count: {
            select: {
              messages: {
                where: {
                  seen: false,
                  receiverId: userId,
                },
              },
            },
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      })

      return conversations
    } catch (error) {
      console.error("Error getting all convos:", error)
      throw new Error("Unable to fetch conversations")
    }
  }
  getConversationById = async (authUserId: string, conversationId: string) => {
    try {
      const conversation = await db.conversation.findUnique({
        where: {
          id: conversationId,
          OR: [{ userAId: authUserId }, { userBId: authUserId }],
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  pfp: true,
                  username: true,
                },
              },
              history: {
                include: {
                  sender: {
                    select: {
                      id: true,
                      pfp: true,
                      username: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              sentAt: "desc",
            },
          },
          userA: {
            select: {
              id: true,
              pfp: true,
              username: true,
              displayName: true,
            },
          },
          userB: {
            select: {
              id: true,
              pfp: true,
              username: true,
              displayName: true,
            },
          },
        },
      })

      return conversation
    } catch (error) {
      console.error("Error fetching conversation:", error)
      throw new Error("Unable to fetch conversation")
    }
  }
  markSongsAsSeen = async (authUserId: string, conversationId: string) => {
    try {
      await db.song.updateMany({
        where: { conversationId, receiverId: authUserId },
        data: { seen: true, seenAt: new Date() },
      })
      return { success: true }
    } catch (err) {
      throw new Error("Unable to mark conversation as seen")
    }
  }
}
