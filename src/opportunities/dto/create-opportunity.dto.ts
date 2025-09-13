import { IsString, IsOptional, IsUUID, IsNotEmpty, IsDecimal, IsDateString, IsEnum } from 'class-validator';
import { OpportunityStage } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateOpportunityDto {
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsNotEmpty()
  dealName: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  estimatedValue: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  probabilityPercentage: number;

  @IsDateString()
  expectedCloseDate: string;

  @IsEnum(OpportunityStage)
  stage: OpportunityStage;

  @IsOptional()
  dealData?: any;
}
