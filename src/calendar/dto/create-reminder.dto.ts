
import { ReminderType } from '@prisma/client';
import { IsEnum, IsDateString, IsUUID } from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  eventId: string;

  @IsEnum(ReminderType)
  type: ReminderType;

  @IsDateString()
  triggerAt: Date;
}