import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  // join room
  async joinRoom(userId: string, roomId: string) {
    return this.prisma.threadParticipant.upsert({
      where: {
        threadId_userId: {
          threadId: roomId,
          userId,
        },
      },
      update: { joinedAt: new Date() },
      create: {
        threadId: roomId,
        userId,
        joinedAt: new Date(),
      },
    });
  }

  // leaving room
  async leaveRoom(userId: string, roomId: string) {
    return this.prisma.threadParticipant.delete({
      where: {
        threadId_userId: {
          threadId: roomId,
          userId,
        },
      },
    });
  }

  // get room participated
  async getRoomParticipants(roomId: string) {
    return this.prisma.threadParticipant.findMany({
      where: { threadId: roomId },
      include: {
        user: { select: { id: true, firstName: true, profileImage: true } },
      },
    });
  }
}
