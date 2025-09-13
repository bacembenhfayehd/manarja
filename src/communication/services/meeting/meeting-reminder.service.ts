import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../email/notification.service';
import { ReminderType } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MeetingReminderService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async createReminder(data: {
    meetingId: string;
    userId: string;
    reminderTime: Date;
    type: ReminderType;
    message?: string;
  }) {
    return this.prisma.meetingReminder.create({
      data: {
        meetingId: data.meetingId,
        userId: data.userId,
        triggerAt: data.reminderTime,
        type: data.type,
      },
    });
  }

  // Programmer des rappels automatiques pour une réunion
  async scheduleAutomaticReminders(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          include: { user: true },
        },
        project: true,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const reminders = [];
    const participants = [
      ...meeting.participants.map((p) => p.user),
      meeting.project,
    ];

    const reminderIntervals = [
      { minutes: 15, type: 'NOTIFICATION' as const },
      { minutes: 60, type: 'EMAIL' as const },
      { minutes: 24 * 60, type: 'EMAIL' as const },
    ];

    for (const participant of participants) {
      for (const interval of reminderIntervals) {
        const reminderTime = new Date(
          meeting.startTime.getTime() - interval.minutes * 60000,
        );

        if (reminderTime > new Date()) {
          // Seulement si dans le futur
          const reminder = await this.createReminder({
            meetingId,
            userId: participant.id,
            reminderTime,
            type: interval.type,
            message: this.generateReminderMessage(meeting, interval.minutes),
          });
          reminders.push(reminder);
        }
      }
    }

    return reminders;
  }

  // Traiter les rappels en attente (à exécuter via cron job)
  async processPendingReminders() {
    const now = new Date();
    const pendingReminders = await this.prisma.meetingReminder.findMany({
      where: {
        isTriggered: false,
        triggerAt: { lte: now },
      },
      include: {
        meeting: {
          include: {
            project: true,
          },
        },
        user: true,
      },
    });

    const processed = [];

    for (const reminder of pendingReminders) {
      try {
        await this.sendReminder(reminder);

        await this.prisma.meetingReminder.update({
          where: { id: reminder.id },
          data: {
            isTriggered: true,
            sentAt: new Date(),
          },
        });

        processed.push(reminder.id);
      } catch (error) {
        await this.prisma.meetingReminder.update({
          where: { id: reminder.id },
          data: {
            isTriggered: true,
          },
        });
      }
    }

    return { processed: processed.length, total: pendingReminders.length };
  }

  private async sendReminder(reminder: any) {
    const meeting = reminder.meeting;
    const user = reminder.user;

    switch (reminder.type) {
      case 'EMAIL':
        await this.emailService.sendEmail({
          to: user.email,
          subject: `Reminder: ${meeting.title}`,
          content:
            reminder.message ||
            this.generateEmailReminderContent(meeting, user),
        });
        break;

      case 'NOTIFICATION':
        await this.notificationService.createNotification({
          userId: user.id,
          type: 'MEETING_REMINDER',
          title: 'Rappel de réunion',
          message: reminder.message || `${meeting.title} starting soon`,
          relatedId: meeting.id,
          relatedType: 'MEETING',
        });
        break;

      case 'SMS':
        // Logique sending with SMS (like Twilio service)
        // await this.smsService.sendSMS(user.phone, reminder.message);
        break;
    }
  }

  async getUserReminders(userId: string, upcoming = true) {
    const where = {
      userId,
      ...(upcoming && {
        reminderTime: { gte: new Date() },
        status: 'PENDING',
      }),
    };

    return this.prisma.meetingReminder.findMany({
      where,
      orderBy: { triggerAt: 'asc' },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });
  }

  async cancelReminder(reminderId: string, userId: string) {
    return this.prisma.meetingReminder.updateMany({
      where: {
        id: reminderId,
        userId,
        isTriggered: false,
      },
      data: {
        isTriggered: true,
      },
    });
  }

  async cancelMeetingReminders(meetingId: string) {
    return this.prisma.meetingReminder.updateMany({
      where: {
        meetingId,
        isTriggered: false,
      },
      data: {
        isTriggered: true,
      },
    });
  }

  private generateReminderMessage(meeting: any, minutesBefore: number): string {
    const timeText =
      minutesBefore < 60
        ? `${minutesBefore} minutes`
        : minutesBefore < 1440
          ? `${Math.floor(minutesBefore / 60)} heures`
          : `${Math.floor(minutesBefore / 1440)} jours`;

    return `Rappel: "${meeting.title}" commence dans ${timeText} (${meeting.startTime.toLocaleString()})`;
  }

  private generateEmailReminderContent(meeting: any, user: any): string {
    return `
      Hello ${user.name},
      
      This is a reminder about your meeting "${meeting.title}".
      
      Details:
      - Date: ${meeting.startTime.toLocaleDateString()}
      - Hour: ${meeting.startTime.toLocaleTimeString()} - ${meeting.endTime.toLocaleTimeString()}
      - Organize: ${meeting.organizer.name}
      
      ${meeting.description ? `Description: ${meeting.description}` : ''}
      
      Best,
      Aamida team
    `;
  }
}
