import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBudgetTrackingDto {
     budgetedAmount: number;

  @IsNumber()
  actualSpent: number; 

  @IsOptional()
  @IsNumber()
  committedAmount?: number;

  @IsOptional()
  @IsString()
  budgetCategory?: string; 
  @IsDateString()
  date: string;

 

  @IsNumber()
  actualAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}