import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { EmailService } from "src/email/email.service";
import { NotificationService } from "../services/email/notification.service";
import { EmailQueueService } from "../services/email/email-queue.service";
import { CurrentUser } from "src/auth/decorators/current-user.decorators";
import { EmailStatus } from "@prisma/client";

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(
    private emailService: EmailService,
    private notificationService: NotificationService,
    private emailQueueService: EmailQueueService,
  ) {}

  
  @Post('send')
  async sendEmail(
    @Body() body: {
      to: string | string[];
      subject: string;
      content: string;
      priority?: 'low' | 'normal' | 'high';
      delay?: number;
    },
  ) {
    return this.emailQueueService.addEmailToQueue(body);
  }

  
  @Post('notification')
  async sendNotificationEmail(
    @Body() body: {
      userId: string;
      type: string;
      subject: string;
      content: string;
      variables?: Record<string, any>;
    },
  ) {
    return this.emailQueueService.addNotificationEmail(body);
  }

  
  @Post('bulk')
  async sendBulkEmails(
    @Body() body: {
      emails: Array<{
        to: string;
        subject: string;
        content: string;
        variables?: Record<string, any>;
      }>;
      options?: {
        priority?: 'low' | 'normal' | 'high';
        batchSize?: number;
        delay?: number;
      };
    },
  ) {
    return this.emailQueueService.addBulkEmails(body.emails, body.options);
  }

  
  @Get('queue/status')
  async getQueueStatus() {
    return this.emailQueueService.getQueueStatus();
  }

  
  @Get('history')
async getEmailHistory(
  @Query('status') status?: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING',
  @Query('recipient') recipient?: string,
  @Query('dateFrom') dateFrom?: string,
  @Query('dateTo') dateTo?: string,
  @Query('limit') limit?: string,
) {
  return this.emailQueueService.getEmailHistory({
    status: status as EmailStatus,
    recipient,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });
}
  
  @Post('retry/:queueId')
  async retryFailedEmail(@Param('queueId') queueId: string) {
    return this.emailQueueService.retryFailedEmail(queueId);
  }

 
  @Get('notifications')
async getUserNotifications(
  @CurrentUser() user: any,
  @Query('limit') limit?: string,
) {
  return this.notificationService.getUserNotifications(
    user.id,
    limit ? parseInt(limit) : undefined,
  );
}

  
  @Put('notifications/read')
  async markNotificationsAsRead(
    @Body() body: { notificationIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.notificationService.markAsRead(body.notificationIds, user.id);
  }

 
  @Get('stats')
  async getEmailStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.emailQueueService.getEmailStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
