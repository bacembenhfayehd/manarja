import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsUUID, IsNotEmpty, IsPositive, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductUnit {
  PIECE = 'PIECE',
  METER = 'METER',
  SQUARE_METER = 'SQUARE_METER',
  CUBIC_METER = 'CUBIC_METER',
  KILOGRAM = 'KILOGRAM',
  LITER = 'LITER',
  BOX = 'BOX',
  PACK = 'PACK'
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Ceramic Tile 30x30cm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Product SKU', example: 'CT-30X30-WH-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ description: 'Product barcode' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiProperty({ description: 'Product category', example: 'Tiles' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @ApiPropertyOptional({ description: 'Product subcategory' })
  @IsOptional()
  @IsString()
  @MaxLength(100)  
  subcategory?: string;

  @ApiProperty({ description: 'Unit of measurement', enum: ProductUnit })
  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @ApiPropertyOptional({ description: 'Standard cost per unit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  standardCost?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  minStockLevel?: number;

  @ApiPropertyOptional({ description: 'Product brand' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Product model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Product specifications' })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Product image URLs' })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Is product active', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;
}
