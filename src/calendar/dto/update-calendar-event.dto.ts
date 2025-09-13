import { PartialType } from '@nestjs/mapped-types';
import { CreateCalendarEventDto } from './create-calendar-event.dto';
import { IsOptional } from 'class-validator';

export class UpdateCalendarEventDto extends PartialType(CreateCalendarEventDto) {
  @IsOptional()
  recurrenceRule?: any; // Plus flexible pour les updates
}