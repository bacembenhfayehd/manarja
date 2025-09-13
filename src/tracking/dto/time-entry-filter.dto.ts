import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeEntryStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, ValidateNested, IsEnum, IsNumber, Min } from 'class-validator';

export enum TimeEntrySortField {
  START_TIME = 'startTime',
  END_TIME = 'endTime',
  DURATION = 'duration',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export class TimeEntryFilterDto {
  
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by task ID' })
  @IsOptional()
  @IsUUID('4')
  taskId?: string;

  @ApiPropertyOptional({ description: 'Filter by timesheet ID' })
  @IsOptional()
  @IsUUID('4')
  timesheetId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: TimeEntryStatus
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus;

  @ApiPropertyOptional({ description: 'Filter by billable status' })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  // Filtres par date (utilisés dans votre service)
  @ApiPropertyOptional({ type: Date, description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: Date, description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Recherche (utilisée dans votre service)
  @ApiPropertyOptional({ description: 'Search term for description' })
  @IsOptional()
  @IsString()
  search?: string;

  // Tri (utilisé dans votre service)
  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsOptional()
  @IsEnum(SortDirection)
  sortOrder?: SortDirection = SortDirection.DESC;

  // Pagination (utilisée dans votre service)
  @ApiPropertyOptional({ description: 'Pagination limit', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination offset', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  // Filtres avancés (optionnels pour évolution future)
  @ApiPropertyOptional({ description: 'Filter by multiple user IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by multiple project IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  projectIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by multiple task IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds?: string[];
}