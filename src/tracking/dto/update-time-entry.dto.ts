import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeEntryDto } from './create-time-entry.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TimeEntryStatus } from '@prisma/client';



export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus;
}
