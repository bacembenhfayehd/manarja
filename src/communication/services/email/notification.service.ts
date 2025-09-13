import { PrismaService } from "src/prisma/prisma.service";
import { EmailService } from "./email.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        createdAt: new Date(),
        read: false,
      },
    });

    
    await this.emailService.sendNotificationEmail(
      data.userId,
      data.type,
      data,
    );

    return notification;
  }

  
  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

 
  async markAsRead(notificationIds: string[], userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { read: true, readAt: new Date() },
    });
  }
}