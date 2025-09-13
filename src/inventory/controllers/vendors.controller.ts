import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VendorsService } from '../services/vendors.service';

@Controller('inventory/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async getVendors(
    @Query('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.vendorsService.findAll(companyId, { search, page, limit });
  }

  @Get(':id')
  async getVendor(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Post()
  async createVendor(@Body() createVendorDto: any) {
    return this.vendorsService.create(createVendorDto);
  }

  @Put(':id')
  async updateVendor(@Param('id') id: string, @Body() updateVendorDto: any) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Delete(':id')
  async deleteVendor(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }

  @Get(':id/products')
  async getVendorProducts(@Param('id') vendorId: string) {
    return this.vendorsService.getProducts(vendorId);
  }
}