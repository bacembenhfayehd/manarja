import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/decorators/current-user.decorators";
import { ChatService } from "../services/chat/chat.service";
import { RoomService } from "../services/chat/room.service";
import { PresenceService } from "../services/chat/presence.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private roomService: RoomService,
    private presenceService: PresenceService,
  ) {}

  
  @Get('rooms/:roomId/history')
  async getRoomHistory(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getRoomHistory(
      roomId,
      limit ? parseInt(limit) : undefined,
    );
  }

  
  @Post('rooms/:roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.roomService.joinRoom(user.id, roomId);
  }

  
  @Post('rooms/:roomId/leave')
  async leaveRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.roomService.leaveRoom(user.id, roomId);
  }

 
  @Get('rooms/:roomId/participants')
  async getRoomParticipants(@Param('roomId') roomId: string) {
    return this.roomService.getRoomParticipants(roomId);
  }

 
  @Get('users/:userId/status')
  async getUserStatus(@Param('userId') userId: string) {
    return this.presenceService.getUserStatus(userId);
  }

  
  @Get('users/online')
  async getOnlineUsers() {
    return this.presenceService.getOnlineUsers();
  }

  @Post('rooms/:roomId/messages')
  async sendChatMessage(
    @Param('roomId') roomId: string,
    @Body() body: {
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE';
    },
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendChatMessage({
      ...body,
      senderId: user.id,
      roomId,
    });
  }
}