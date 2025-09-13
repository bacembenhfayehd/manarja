import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, IsPositive, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

export class CreateInventoryTransactionDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Transaction quantity' })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  unitCost: number;

  @ApiPropertyOptional({ description: 'Reference document (PO, invoice, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Related purchase requisition ID' })
  @IsOptional()
  @IsUUID()
  requisitionId?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  transactionDate?: Date;
}
