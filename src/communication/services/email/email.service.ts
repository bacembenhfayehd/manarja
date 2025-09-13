import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async sendEmail(data: {
    to: string | string[];
    subject: string;
    content: string;
    templateId?: string;
    variables?: Record<string, any>;
  }) {
    const emailData = {
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      content: data.content,
      sentAt: new Date(),
      status: 'SENT' as const,
    };

    return this.prisma.emailLog.create({
      data: emailData,
    });
  }

  async sendNotificationEmail(userId: string, type: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (!user) {
      return null;
    }

    const templates = {
      NEW_MESSAGE: {
        subject: 'New message',
        content: `Hello ${user.firstName}, you've recieved new message .`,
      },
      MEETING_REMINDER: {
        subject: 'Reminder meeting',
        content: `Hello ${user.firstName}, meeting coming after 15 mins.`,
      },
    };

    const template = templates[type];
    if (!template) return null;

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      content: template.content,
    });
  }
}
