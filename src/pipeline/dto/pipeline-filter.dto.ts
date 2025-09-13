import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { OpportunityStage } from '@prisma/client';

export class PipelineFilterDto {
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}