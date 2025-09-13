import { IsString, IsOptional, IsUUID, IsEnum, IsArray, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DocumentType, DocumentStatus } from './create-document.dto';

export class DocumentFilterDto {
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  @IsOptional()
  types?: DocumentType[];

  @IsArray()
  @IsEnum(DocumentStatus, { each: true })
  @IsOptional()
  statuses?: DocumentStatus[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  folderIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  projectIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  createdByUsers?: string[];

  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @IsDateString()
  @IsOptional()
  updatedAfter?: string;

  @IsDateString()
  @IsOptional()
  updatedBefore?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isPublic?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minSizeBytes?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxSizeBytes?: number;

  @IsString()
  @IsOptional()
  searchText?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  includeArchived?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  hasPreview?: boolean;
}

export class DocumentSortDto {
  @IsString()
  @IsOptional()
  @IsEnum(['title', 'filename', 'size', 'type', 'status', 'createdAt', 'updatedAt', 'createdBy'])
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class DocumentPaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class CompleteDocumentFilterDto extends DocumentFilterDto {
  // Pagination
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  // Tri
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}