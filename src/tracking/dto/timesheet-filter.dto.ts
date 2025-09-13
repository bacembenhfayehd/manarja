import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeEntryStatus } from '../enum/time-entry-status.enum';


export class TimesheetFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrer par utilisateur (ID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut du timesheet',
    enum: TimeEntryStatus ,
    example: TimeEntryStatus .SUBMITTED
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus )
  status?: TimeEntryStatus ;

  @ApiPropertyOptional({
    description: 'start date to filter timesheet (week >= this date)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @ApiPropertyOptional({
    description: 'endt date to filter timesheets (weej <= this date)',
    example: '2024-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  weekEnd?: string;
}