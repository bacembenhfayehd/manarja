import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isPublic?: boolean = false;
}

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => Boolean(value))
  isPublic?: boolean;
}
