import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit } from './create-product.dto';
import { VendorResponseDto } from '../vendor/vendor-response.dto';

export class ProductVendorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  supplierSku: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  minOrderQuantity: number;

  @ApiProperty()
  leadTimeDays: number;

  @ApiProperty()
  isPreferred: boolean;

  @ApiPropertyOptional()
  vendor?: VendorResponseDto;
}

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
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sku: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiProperty({ enum: ProductUnit })
  unit: ProductUnit;

  @ApiPropertyOptional()
  standardCost?: number;

  @ApiPropertyOptional()
  minStockLevel?: number;

  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  model?: string;

  @ApiPropertyOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional()
  imageUrls?: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ProductVendorResponseDto] })
  productVendors?: ProductVendorResponseDto[];

  @ApiPropertyOptional()
  inventoryBalance?: InventoryBalanceResponseDto;
}
