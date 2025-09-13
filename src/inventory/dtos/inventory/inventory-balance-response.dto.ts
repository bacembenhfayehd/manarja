import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../product/product-response.dto';
import { TransactionType } from '@prisma/client';

export class InventoryBalanceResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  averageCost: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  lastUpdated: Date;

  @ApiPropertyOptional()
  product?: ProductResponseDto;
}

export class InventoryValuationResponseDto {
  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  productCount: number;

  @ApiProperty()
  calculatedAt: Date;
}

export class InventoryTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalCost: number;

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  requisitionId?: string;

  @ApiProperty()
  transactionDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  product?: ProductResponseDto;
}
