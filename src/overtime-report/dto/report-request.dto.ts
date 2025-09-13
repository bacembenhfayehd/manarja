import { IsDateString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

export class ReportRequestDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod = ReportPeriod.WEEKLY;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeOvertimeOnly?: boolean = false;
}