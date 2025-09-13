import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from '../services/products.service';

@Controller('inventory/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productsService.findAll(companyId, { search, category, page, limit });
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  async createProduct(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/vendors')
  async getProductVendors(@Param('id') productId: string) {
    return this.productsService.getVendors(productId);
  }

  @Get('low-stock/:companyId')
  async getLowStockProducts(@Param('companyId') companyId: string) {
    return this.productsService.getLowStockProducts(companyId);
  }
}
