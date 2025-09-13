import { IsString, IsOptional, IsArray, IsNotEmpty, IsUUID, IsDateString, IsNumber, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';


export class CreateEstimateItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber() 
  quantity: number | Decimal; 

  @IsNumber()
  unitPrice: number | Decimal; 

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateEstimateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @Type(() => CreateEstimateItemDto)
  items: CreateEstimateItemDto[];
}
