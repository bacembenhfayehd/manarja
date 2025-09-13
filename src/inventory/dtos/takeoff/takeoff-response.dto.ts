
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductResponseDto } from '../product/product-response.dto';

export class TakeoffItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  takeoffId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional()
  unitPrice?: number;

  @ApiPropertyOptional()
  totalPrice?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  product?: ProductResponseDto;
}

export class TakeoffResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  area?: string;

  @ApiPropertyOptional()
  trade?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalEstimatedCost: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [TakeoffItemResponseDto] })
  takeoffItems: TakeoffItemResponseDto[];
}
