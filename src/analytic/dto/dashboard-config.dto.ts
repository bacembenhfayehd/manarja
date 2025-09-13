import { IsOptional, IsArray, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kpiMetrics?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(['day', 'week', 'month'])
  timeInterval?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTimeAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeExpenseAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTaskStatus?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chartTypes?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';
}
