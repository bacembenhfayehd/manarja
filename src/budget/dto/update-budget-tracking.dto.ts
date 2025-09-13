import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBudgetTrackingDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budgetedAmount?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  actualSpent?: number; 

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  committedAmount?: number; 

  @IsOptional()
  @IsString()
  budgetCategory?: string; 

 
}