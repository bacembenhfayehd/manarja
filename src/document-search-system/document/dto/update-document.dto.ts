import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsEnum, IsArray, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentStatus } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

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
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}