import { IsString, IsOptional, IsUUID, IsEnum, IsArray, IsNotEmpty, MaxLength, IsUrl, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum DocumentType {
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  OTHER = 'other'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PRIVATE = 'private'
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;

  @Type(() => Number)
  size: number;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus = DocumentStatus.DRAFT;

  @IsUUID()
  @IsOptional()
  folderId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isPublic?: boolean = false;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
