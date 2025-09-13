import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { EventType, Prisma } from '@prisma/client';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { RecurrenceRule } from '../interfaces/availability.interface';


@Injectable()
export class CalendarEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateCalendarEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        ...dto,
        userId,
        recurrenceRule: dto.recurrenceRule as unknown as Prisma.JsonObject,
      },
    });
  }

  async updateEvent(id: string, userId: string, dto: UpdateCalendarEventDto) {
    return this.prisma.calendarEvent.update({
      where: { id, userId },
      data: {
        ...dto,
        recurrenceRule: dto.recurrenceRule as unknown as Prisma.JsonObject,
      },
    });
  }

  async deleteEvent(id: string, userId: string) {
    return this.prisma.calendarEvent.delete({
      where: { id, userId },
    });
  }

  async getUserEvents(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      projectId?: string;
      eventType?: EventType;
    },
  ) {
    return this.prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(filters.startDate && { startTime: { gte: filters.startDate } }),
        ...(filters.endDate && { endTime: { lte: filters.endDate } }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.eventType && { eventType: filters.eventType }),
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async handleRecurringEvent(
    eventId: string,
    options: {
      applyTo?: 'THIS' | 'FUTURE' | 'ALL';
      recurrenceRule?: RecurrenceRule;
    },
  ) {
    // Implémentation complexe de la gestion des événements récurrents
    // À développer selon les besoins spécifiques
  }
}