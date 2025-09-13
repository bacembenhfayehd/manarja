import { PartialType } from '@nestjs/mapped-types';

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @IsOptional()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  reportType?: ReportType;

  @IsOptional()
  filters?: {
    userId?: number;
    projectId?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    priority?: string;
    category?: string;
    assigneeId?: number;
  };

  @IsOptional()
  isScheduled?: boolean;

  @IsOptional()
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}
