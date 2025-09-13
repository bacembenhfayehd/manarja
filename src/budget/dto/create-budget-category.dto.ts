import { BudgetItemType } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateBudgetCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BudgetItemType)
  type: BudgetItemType;

  @IsNumber()
  @Min(0)
  estimatedAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unitType?: string;
}