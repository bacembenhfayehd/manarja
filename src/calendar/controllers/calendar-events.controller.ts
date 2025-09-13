import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { EventType, User } from '@prisma/client';
import { CalendarEventsService } from '../services/calendar-events.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';


@Controller('calendar/events')
@UseGuards(JwtAuthGuard)
export class CalendarEventsController {
  constructor(private readonly eventsService: CalendarEventsService) {}

  @Post()
  createEvent(
    @CurrentUser() user: User,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.eventsService.createEvent(user.id, dto);
  }

  @Put(':id')
  updateEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.eventsService.updateEvent(id, user.id, dto);
  }

  @Delete(':id')
  deleteEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.eventsService.deleteEvent(id, user.id);
  }

  @Get()
  getEvents(
    @CurrentUser() user: User,
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
    @Query('project') projectId?: string,
    @Query('type') eventType?: EventType,
  ) {
    return this.eventsService.getUserEvents(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      projectId,
      eventType,
    });
  }

  @Post(':id/recurrence')
  handleRecurrence(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { applyTo: 'THIS' | 'FUTURE' | 'ALL'; recurrenceRule?: any },
  ) {
    return this.eventsService.handleRecurringEvent(id, {
      applyTo: body.applyTo,
      recurrenceRule: body.recurrenceRule,
    });
  }
}