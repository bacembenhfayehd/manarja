import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeEntryStatus } from '../enum/time-entry-status.enum';


export class QueryTimesheetDto {
  @ApiPropertyOptional({
    description: 'Filter with (ID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter with timesheet status',
    enum: TimeEntryStatus,
    example: TimeEntryStatus.SUBMITTED
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus;

  @ApiPropertyOptional({
    description: 'start date to filter timesheets (week >= this date)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  weekStart?: string;

  @ApiPropertyOptional({
    description: 'end date to filter timesheets (week <= this date)',
    example: '2024-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  weekEnd?: string;
}