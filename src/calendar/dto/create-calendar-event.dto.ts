
import { EventType } from '@prisma/client';
import { IsOptional, IsDateString, IsEnum, IsString, IsUUID } from 'class-validator';
import { RecurrenceRule } from '../interfaces/availability.interface';

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  recurrenceRule?: RecurrenceRule;
}