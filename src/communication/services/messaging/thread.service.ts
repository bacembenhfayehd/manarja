import { Injectable } from "@nestjs/common";
import { ThreadType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ThreadService {
  constructor(private prisma: PrismaService) {}

 
  async createThread(data: {
    title: string;
    creatorId: string;
    participantIds: string[];
    type: ThreadType
  }) {
    return this.prisma.thread.create({
      data: {
        title: data.title,
        createdById: data.creatorId,
        type: data.type,
        participants: {
          create: data.participantIds.map(userId => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, profileImage: true } },
          },
        },
      },
    });
  }

  
  async addParticipant(threadId: string, userId: string) {
    return this.prisma.threadParticipant.create({
      data: { threadId, userId },
    });
  }

  
  async getUserThreads(userId: string) {
    return this.prisma.thread.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, profileImage: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });
  }
}
