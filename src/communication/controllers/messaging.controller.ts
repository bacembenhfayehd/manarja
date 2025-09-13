import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { MessagingService } from '../services/messaging/messaging.service';
import { ThreadService } from '../services/messaging/thread.service';
import { MessageAttachmentService } from '../services/messaging/message-attachment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';


@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private messagingService: MessagingService,
    private threadService: ThreadService,
    private attachmentService: MessageAttachmentService,
  ) {}

 
  @Post('messages')
  async sendMessage(
    @Body() body: {
      content: string;
      receiverId?: string;
      threadId?: string;
      attachments?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.messagingService.createMessage({
      ...body,
      senderId: user.id,
    });
  }

 
  @Get('messages')
  async getMessages(
    @Query('otherUserId') otherUserId?: string,
    @Query('threadId') threadId?: string,
    @CurrentUser() user: any,
  ) {
    return this.messagingService.getMessages(user.id, otherUserId, threadId);
  }

  
  @Put('messages/read')
  async markAsRead(
    @Body() body: { messageIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.messagingService.markAsRead(body.messageIds, user.id);
  }

  
  @Get('conversations')
  async getRecentConversations(@CurrentUser() user: any) {
    return this.messagingService.getRecentConversations(user.id);
  }

 
  @Post('threads')
  async createThread(
    @Body() body: {
      title: string;
      participantIds: string[];
      type: 'PROJECT' | 'GROUP' | 'SUPPORT';
    },
    @CurrentUser() user: any,
  ) {
    return this.threadService.createThread({
      ...body,
      creatorId: user.id,
    });
  }

  
  @Get('threads')
  async getUserThreads(@CurrentUser() user: any) {
    return this.threadService.getUserThreads(user.id);
  }

  
  @Post('threads/:threadId/participants')
  async addParticipant(
    @Param('threadId') threadId: string,
    @Body() body: { userId: string },
  ) {
    return this.threadService.addParticipant(threadId, body.userId);
  }

  
  @Post('attachments')
  async uploadAttachment(
    @Body() body: {
      messageId: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      size: number;
      filePath: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.attachmentService.uploadAttachment({
      ...body,
      uploadedBy: user.id,
    });
  }

  
  @Get('messages/:messageId/attachments')
  async getMessageAttachments(@Param('messageId') messageId: string) {
    return this.attachmentService.getMessageAttachments(messageId);
  }

  
  @Delete('attachments/:attachmentId')
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.attachmentService.deleteAttachment(attachmentId, user.id);
  }
}
