import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReportType {
  PROJECT_OVERVIEW = 'PROJECT_OVERVIEW',
  TIME_TRACKING = 'TIME_TRACKING',
  EXPENSE_SUMMARY = 'EXPENSE_SUMMARY'
}

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsObject()
  filters: {
    userId?: number;
    projectId?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    priority?: string;
    category?: string;
    assigneeId?: number;
  };

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isScheduled?: boolean;

  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY'])
  @IsOptional()
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}
