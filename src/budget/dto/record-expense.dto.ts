import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ExpenseType } from '../enums/expense-type.enum';

export class RecordExpenseDto {
  @IsString()
  budgetId: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}