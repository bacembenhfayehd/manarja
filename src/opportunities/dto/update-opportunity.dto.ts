import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { OpportunityStage } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateOpportunityDto {
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  dealName?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  estimatedValue?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  probabilityPercentage?: number;

  @IsOptional()
  expectedCloseDate?: string;

  @IsEnum(OpportunityStage)
  @IsOptional()
  stage?: OpportunityStage;

  @IsOptional()
  dealData?: any;
}
