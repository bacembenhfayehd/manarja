import { ApiProperty } from '@nestjs/swagger';
import { ProjectType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectTemplateDto } from './create-project-template.dto';

export class UpdateProjectTemplateDto extends PartialType(CreateProjectTemplateDto) {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: ProjectType, required: false })
  @IsEnum(ProjectType)
  @IsOptional()
  type?: ProjectType;
}