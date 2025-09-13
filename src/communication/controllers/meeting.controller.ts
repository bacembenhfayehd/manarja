import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MeetingService } from "../services/meeting/meeting.service";
import { AvailabilityService } from "../services/meeting/availability.service";
import { CalendarService } from "../services/meeting/calendar.service";
import { MeetingReminderService } from "../services/meeting/meeting-reminder.service";
import { CurrentUser } from "src/auth/decorators/current-user.decorators";
import { userInfo } from "os";

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(
    private meetingService: MeetingService,
    private availabilityService: AvailabilityService,
    private calendarService: CalendarService,
    private reminderService: MeetingReminderService,
  ) {}

  
  @Post()
  async createMeeting(
    @Body() body: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      participantIds: string[];
      type: 'VIDEO_CALL' | 'PHONE_CALL' | 'IN_PERSON';
      autoReminders?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    const meeting = await this.meetingService.createMeeting({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      organizerId: user.id,
    });

    // Programmer les rappels automatiques si demandé
    if (body.autoReminders) {
      await this.reminderService.scheduleAutomaticReminders(meeting.id);
    }

    return meeting;
  }

  
  @Get()
  async getUserMeetings(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() userInfo: any,
  ) {
    return this.meetingService.getUserMeetings(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

 
  @Get(':meetingId')
  async getMeetingDetails(@Param('meetingId') meetingId: string) {
    return this.meetingService.getUserMeetings('', undefined, undefined);
  }

  
  @Put(':meetingId/respond')
  async respondToInvitation(
    @Param('meetingId') meetingId: string,
    @Body() body: { response: 'ACCEPTED' | 'DECLINED' },
    @CurrentUser() user: any,
  ) {
    return this.meetingService.respondToInvitation(
      meetingId,
      user.id,
      body.response,
    );
  }

  
  @Post('availability/check')
  async checkAvailability(
    @Body() body: {
      userId: string;
      startTime: string;
      endTime: string;
    },
  ) {
    return this.availabilityService.checkAvailability(
      body.userId,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }

  
  @Post('availability/suggest')
  async suggestTimeSlots(
    @Body() body: {
      userIds: string[];
      date: string;
      duration: number;
    },
  ) {
    return this.availabilityService.suggestTimeSlots(
      body.userIds,
      new Date(body.date),
      body.duration,
    );
  }

  
  @Post('calendar/sync/google')
  async syncWithGoogleCalendar(
    @Body() body: { accessToken: string },
    @CurrentUser() user: any,
  ) {
    return this.calendarService.syncWithGoogleCalendar(user.id, body.accessToken);
  }

 
  @Post('calendar/sync/outlook')
  async syncWithOutlookCalendar(
    @Body() body: { accessToken: string },
    @CurrentUser() user: any,
  ) {
    return this.calendarService.syncWithOutlookCalendar(user.id, body.accessToken);
  }

  
  @Post(':meetingId/export/google')
  async exportToGoogleCalendar(
    @Param('meetingId') meetingId: string,
    @Body() body: { accessToken: string },
  ) {
    return this.calendarService.exportToGoogleCalendar(meetingId, body.accessToken);
  }

 
  @Get('calendar/events')
  async getCalendarEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.calendarService.getUserCalendarEvents(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

 
  @Post('recurring')
  async createRecurringMeeting(
    @Body() body: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      participantIds: string[];
      recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      recurrenceEnd: string;
      interval?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.calendarService.createRecurringMeeting({
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      recurrenceEnd: new Date(body.recurrenceEnd),
      organizerId: user.id,
    });
  }

 
  @Post(':meetingId/reminders')
  async createReminder(
    @Param('meetingId') meetingId: string,
    @Body() body: {
      reminderTime: string;
      type: 'EMAIL' | 'NOTIFICATION' | 'SMS';
      message?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.reminderService.createReminder({
      meetingId,
      userId: user.id,
      reminderTime: new Date(body.reminderTime),
      type: body.type,
      message: body.message,
    });
  }

  
  @Get('reminders')
  async getUserReminders(
    @Query('upcoming') upcoming?: string,
    @CurrentUser() user: any,
  ) {
    return this.reminderService.getUserReminders(
      user.id,
      upcoming === 'true',
    );
  }

  @Delete('reminders/:reminderId')
  async cancelReminder(
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: any,
  ) {
    return this.reminderService.cancelReminder(reminderId, user.id);
  }

 
  @Post('reminders/process')
  async processReminders() {
    return this.reminderService.processPendingReminders();
  }
}