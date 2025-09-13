import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  // Synchroniser avec Google Calendar
  async syncWithGoogleCalendar(userId: string, googleAccessToken: string) {
    
    
    try {
     
      const googleEvents = await this.fetchGoogleCalendarEvents(googleAccessToken);
      
      for (const event of googleEvents) {
        await this.createOrUpdateMeetingFromCalendar({
          externalId: event.id,
          title: event.summary,
          description: event.description,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          organizerId: userId,
          source: 'GOOGLE_CALENDAR',
        });
      }

      return { success: true, synced: googleEvents.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  
  async syncWithOutlookCalendar(userId: string, outlookAccessToken: string) {
    try {
      const outlookEvents = await this.fetchOutlookCalendarEvents(outlookAccessToken);
      
      for (const event of outlookEvents) {
        await this.createOrUpdateMeetingFromCalendar({
          externalId: event.id,
          title: event.subject,
          description: event.body?.content,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          organizerId: userId,
          source: 'OUTLOOK_CALENDAR',
        });
      }

      return { success: true, synced: outlookEvents.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  
  private async createOrUpdateMeetingFromCalendar(data: {
    externalId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    organizerId: string;
    source: 'GOOGLE_CALENDAR' | 'OUTLOOK_CALENDAR';
  }) {
    return this.prisma.meeting.upsert({
      where: {
        externalId_source: {
          externalId: data.externalId,
          source: data.source,
        },
      },
      update: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        updatedAt: new Date(),
      },
      create: {
        externalId: data.externalId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        organizerId: data.organizerId,
        source: data.source,
        type: 'VIDEO_CALL',
        status: 'SCHEDULED',
      },
    });
  }

  
  async exportToGoogleCalendar(meetingId: string, googleAccessToken: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        organizer: true,
        participants: {
          include: { user: true },
        },
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

   
    const googleEvent = {
      summary: meeting.title,
      description: meeting.description,
      start: {
        dateTime: meeting.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: meeting.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: meeting.participants.map(p => ({
        email: p.user.email,
        displayName: p.user.name,
      })),
    };

    
    const createdEvent = await this.createGoogleCalendarEvent(googleEvent, googleAccessToken);
    
   
    await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        externalId: createdEvent.id,
        source: 'GOOGLE_CALENDAR',
      },
    });

    return createdEvent;
  }

 
  async getUserCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.meeting.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { participants: { some: { userId } } },
        ],
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        organizer: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, firstName: true } },
          },
        },
      },
    });
  }

  
  async createRecurringMeeting(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    organizerId: string;
    participantIds: string[];
    recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recurrenceEnd: Date;
    interval?: number; 
  }) {
    const meetings = [];
    const duration = data.endTime.getTime() - data.startTime.getTime();
    let currentStart = new Date(data.startTime);

    while (currentStart <= data.recurrenceEnd) {
      const currentEnd = new Date(currentStart.getTime() + duration);
      
      const meeting = await this.prisma.meeting.create({
        data: {
          title: data.title,
          description: data.description,
          startTime: new Date(currentStart),
          endTime: currentEnd,
          organizerId: data.organizerId,
          type: 'VIDEO_CALL',
          status: 'SCHEDULED',
          recurrencePattern: data.recurrencePattern,
          participants: {
            create: data.participantIds.map(userId => ({
              userId,
              status: 'INVITED',
            })),
          },
        },
      });

      meetings.push(meeting);

      
      switch (data.recurrencePattern) {
        case 'DAILY':
          currentStart.setDate(currentStart.getDate() + (data.interval || 1));
          break;
        case 'WEEKLY':
          currentStart.setDate(currentStart.getDate() + 7 * (data.interval || 1));
          break;
        case 'MONTHLY':
          currentStart.setMonth(currentStart.getMonth() + (data.interval || 1));
          break;
      }
    }

    return meetings;
  }

  // loading...
  private async fetchGoogleCalendarEvents(accessToken: string) {
    // loading...
    return [];
  }

  private async fetchOutlookCalendarEvents(accessToken: string) {
    // loading...
    return [];
  }

  private async createGoogleCalendarEvent(event: any, accessToken: string) {
    // loading...
    return { id: 'google-event-id' };
  }
}
