import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequisitionStatus, Priority } from './create-purchase-requisition.dto';
import { VendorResponseDto } from '../vendor/vendor-response.dto';
import { ProductResponseDto } from '../product/product-response.dto';
import { TakeoffResponseDto } from '../takeoff/takeoff-response.dto';

export class RequisitionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requisitionId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  product?: ProductResponseDto;
}

export class PurchaseRequisitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vendorId: string;

  @ApiPropertyOptional()
  takeoffId?: string;

  @ApiProperty({ enum: RequisitionStatus })
  status: RequisitionStatus;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty()
  totalAmount: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  requiredDate?: Date;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  rejectedBy?: string;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  vendor?: VendorResponseDto;

  @ApiPropertyOptional()
  takeoff?: TakeoffResponseDto;

  @ApiProperty({ type: [RequisitionItemResponseDto] })
  requisitionItems: RequisitionItemResponseDto[];
}