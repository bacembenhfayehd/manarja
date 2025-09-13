import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, IsPositive, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVendorDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsUUID()
  vendorId: string;

  @ApiProperty({ description: 'Supplier SKU', example: 'SUP-CT-001' })
  @IsString()
  @MaxLength(100)
  supplierSku: string;

  @ApiProperty({ description: 'Unit price from vendor' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity', default: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  minOrderQuantity?: number = 1;

  @ApiPropertyOptional({ description: 'Lead time in days', default: 7 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  leadTimeDays?: number = 7;

  @ApiPropertyOptional({ description: 'Is preferred vendor', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPreferred?: boolean = false;
}
