import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

import { SendMessageDto } from '../dtos/chat/send-message.dto';
import { JoinRoomDto } from '../dtos/chat/join-room.dto';
import { ChatEventDto } from '../dtos/chat/chat-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*', // to remplaced later
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Server) {
    console.log('Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) {
      client.disconnect();
      return;
    }

    
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    client.join(`user_${userId}`);
    this.server.emit('userOnline', { userId });

    console.log(`Client connected: ${client.id}, User: ${userId}`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) return;

    
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });

    this.server.emit('userOffline', { userId, lastSeen: new Date() });
    console.log(`Client disconnected: ${client.id}, User: ${userId}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: joinRoomDto.roomId },
      include: { participants: true },
    });

    if (!room || !room.participants.some(p => p.id === userId)) {
      client.emit('error', { message: 'Access to room denied' });
      return;
    }

    client.join(`room_${joinRoomDto.roomId}`);
    client.emit('roomJoined', { roomId: joinRoomDto.roomId });

   
    client.to(`room_${joinRoomDto.roomId}`).emit('userJoined', {
      roomId: joinRoomDto.roomId,
      userId: joinRoomDto.userId,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: sendMessageDto.roomId },
      include: { participants: true },
    });

    if (!room || !room.participants.some(p => p.id === userId)) {
      client.emit('error', { message: 'Access to room denied' });
      return;
    }

    
    const message = await this.prisma.chatMessage.create({
      data: {
        content: sendMessageDto.content,
        type: sendMessageDto.type,
        metadata: sendMessageDto.metadata,
        room: { connect: { id: sendMessageDto.roomId } },
        sender: { connect: { id: userId } },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    
    this.server.to(`room_${sendMessageDto.roomId}`).emit('newMessage', message);

   
    const otherParticipants = room.participants.filter(p => p.id !== userId);
    otherParticipants.forEach(participant => {
      if (!this.server.sockets.adapter.rooms.has(`user_${participant.id}`)) {
        this.server.to(`user_${participant.id}`).emit('unreadMessage', {
          roomId: sendMessageDto.roomId,
          message: message.content,
          sender: message.sender,
        });
      }
    });
  }

  @SubscribeMessage('chatEvent')
  async handleChatEvent(
    @MessageBody() chatEventDto: ChatEventDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;

    switch (chatEventDto.eventType) {
      case 'typing':
        if (chatEventDto.roomId) {
          client.to(`room_${chatEventDto.roomId}`).emit('userTyping', {
            roomId: chatEventDto.roomId,
            userId,
          });
        }
        break;

      case 'read_receipt':
        if (chatEventDto.roomId && chatEventDto.messageId) {
          
          await this.prisma.chatMessage.update({
            where: { id: chatEventDto.messageId },
            data: { readAt: new Date() },
          });

          client.to(`room_${chatEventDto.roomId}`).emit('messageRead', {
            roomId: chatEventDto.roomId,
            messageId: chatEventDto.messageId,
            userId,
          });
        }
        break;

      default:
        break;
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() { roomId }: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`room_${roomId}`);
    client.emit('roomLeft', { roomId });

    
    client.to(`room_${roomId}`).emit('userLeft', {
      roomId,
      userId: client.handshake.auth.userId,
    });
  }
}