import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateBudgetCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}