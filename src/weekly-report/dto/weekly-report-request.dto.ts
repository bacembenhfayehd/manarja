import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class WeeklyReportRequestDto {
  @IsOptional()
  @IsDateString()
  weekStartDate?: string; 

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeWeekends?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDetails?: boolean = true;
}