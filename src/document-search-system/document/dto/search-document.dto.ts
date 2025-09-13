import { IsString, IsOptional, IsUUID, IsEnum, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DocumentType, DocumentStatus } from './create-document.dto';

export class SearchDocumentsDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @IsUUID()
  @IsOptional()
  folderId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDateString()
  @IsOptional()
  createdFrom?: string;

  @IsDateString()
  @IsOptional()
  createdTo?: string;

  @IsDateString()
  @IsOptional()
  updatedFrom?: string;

  @IsDateString()
  @IsOptional()
  updatedTo?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isPublic?: boolean;

  @Type(() => Number)
  @IsOptional()
  minSize?: number;

  @Type(() => Number)
  @IsOptional()
  maxSize?: number;

  @IsString()
  @IsOptional()
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'size' | 'type' = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
