import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductVendorsService } from '../services/product-vendors.service';

@Controller('inventory/product-vendors')
export class ProductVendorsController {
  constructor(private readonly productVendorsService: ProductVendorsService) {}

  @Post()
  async linkProductVendor(@Body() linkDto: any) {
    return this.productVendorsService.linkProductVendor(
      linkDto.productId,
      linkDto.vendorId,
      linkDto.details
    );
  }

  @Put(':id')
  async updateProductVendor(@Param('id') id: string, @Body() updateDto: any) {
    return this.productVendorsService.updateLink(id, updateDto);
  }

  @Delete(':id')
  async unlinkProductVendor(@Param('id') id: string) {
    return this.productVendorsService.unlinkProductVendor(id);
  }

  @Get('product/:productId/best-vendor')
  async getBestVendor(@Param('productId') productId: string) {
    return this.productVendorsService.getBestVendorForProduct(productId);
  }

  @Put(':id/set-preferred')
  async setPreferredVendor(@Param('id') id: string) {
    return this.productVendorsService.setAsPreferred(id);
  }
}