import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Thread } from '@prisma/client';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    threadId: string;
    attachments?: {
      filename: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }[];
  }) {
    // Create principal message
    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        threadId: data.threadId,
        type: 'TEXT', // default value
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    if (data.attachments && data.attachments.length > 0) {
      await this.prisma.messageAttachment.createMany({
        data: data.attachments.map((att) => ({
          messageId: message.id,
          filename: att.filename,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize,
        })),
      });

      return this.prisma.message.findUnique({
        where: { id: message.id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          thread: {
            select: {
              id: true,
              title: true,
              type: true,
              participants: {
                include: {
                  user: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
          attachments: true,
        },
      });
    }

    return message;
  }

  async getMessages(userId: string, otherUserId?: string, threadId?: string) {
    let where: any;

    if (threadId) {
      where = { threadId };
    } else if (otherUserId) {
      const directThread = await this.prisma.thread.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: [userId, otherUserId] },
            },
          },
        },
      });

      if (!directThread) {
        return [];
      }

      where = { threadId: directThread.id };
    } else {
      const userThreads = await this.prisma.thread.findMany({
        where: {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        select: { id: true },
      });

      where = {
        threadId: {
          in: userThreads.map((t) => t.id),
        },
      };
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        thread: {
          select: {
            id: true,
            type: true,
            title: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async markAsRead(threadId: string, userId: string) {
    // Mettre à jour le lastRead du participant
    await this.prisma.threadParticipant.update({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      data: { lastRead: new Date() },
    });
  }

  async getLastReadDate(threadId: string, userId: string) {
    const participant = await this.prisma.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      select: { lastRead: true },
    });
    return participant?.lastRead || new Date(0); // Date très ancienne si jamais lu
  }

  async getRecentConversations(userId: string) {
    const threads = await this.prisma.thread.findMany({
      where: {
        participants: {
          some: { userId },
        },
        isArchived: false,
      },
      orderBy: { lastActivity: 'desc' },
      take: 20,
      include: {
        participants: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Dernier message seulement
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                profileImage: true,
              },
            },
            attachments: { take: 1 }, // Première pièce jointe si besoin
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Formater la réponse
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread) => ({
        id: thread.id,
        title: thread.title,
        type: thread.type,
        project: thread.project,
        lastMessage: thread.messages[0],
        unreadCount: await this.getUnreadCount(thread.id, userId),
        participants: thread.participants.map((p) => p.user),
        lastActivity: thread.lastActivity,
      })),
    );

    return threadsWithUnread;
  }

  async getUnreadCount(threadId: string, userId: string) {
    const lastRead = await this.getLastReadDate(threadId, userId);
    return this.prisma.message.count({
      where: {
        threadId,
        senderId: { not: userId },
        createdAt: { gt: lastRead },
      },
    });
  }
}
