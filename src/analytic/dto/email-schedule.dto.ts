import { IsNumber, IsEnum, IsArray, IsString, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ReportFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export class EmailRecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class EmailScheduleDto {
  @IsNumber()
  @Type(() => Number)
  reportId: number;

  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  recipients: EmailRecipientDto[];

  @IsOptional()
  @IsString()
  time?: string; // Format: "HH:MM" (e.g., "09:00")

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfWeek?: number; // 0-6 (Sunday = 0)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfMonth?: number; // 1-31

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailMessage?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['html', 'pdf', 'excel', 'csv'])
  attachmentFormat?: 'html' | 'pdf' | 'excel' | 'csv';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCharts?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  active?: boolean;
}
