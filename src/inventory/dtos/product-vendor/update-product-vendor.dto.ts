import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductVendorDto } from './create-product-vendor.dto';

export class UpdateProductVendorDto extends PartialType(
  OmitType(CreateProductVendorDto, ['productId', 'vendorId'] as const)
) {}
