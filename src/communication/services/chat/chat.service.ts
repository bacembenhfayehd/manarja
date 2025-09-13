import { PrismaService } from "src/prisma/prisma.service";
import { MessagingService } from "../messaging/messaging.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private messagingService: MessagingService,
  ) {}

  // send msj in real tima
  async sendChatMessage(data: {
    content: string;
    senderId: string;
    roomId: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE';
  }) {
    // save the msj
    const message = await this.messagingService.createMessage({
      content: data.content,
      senderId: data.senderId,
      threadId: data.roomId,
    });

    // return formated message for websocket
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      roomId: data.roomId,
      timestamp: message.createdAt,
      type: data.type || 'TEXT',
    };
  }

  // room history
  async getRoomHistory(roomId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { threadId: roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, profileImage: true } },
      },
    });
  }
}
