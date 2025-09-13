import { ApiProperty } from '@nestjs/swagger';
import { ProjectType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateTemplatePhaseDto } from './template-phase/create-template-phase.dto';


export class CreateProjectTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectType })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ type: [CreateTemplatePhaseDto], required: false })
  @IsOptional()
  phases?: CreateTemplatePhaseDto[];
}