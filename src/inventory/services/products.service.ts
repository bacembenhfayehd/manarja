// src/inventory/services/products.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto } from '../dtos/product/create-product.dto';
import { UpdateProductDto } from '../dtos/product/update-product.dto';
import { ProductResponseDto } from '../dtos/product/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Vérifier l'unicité du SKU
    const existingProduct = await this.productsRepository.findBySku(createProductDto.sku);
    if (existingProduct) {
      throw new ConflictException('Un produit avec ce SKU existe déjà');
    }

    const product = await this.productsRepository.create(createProductDto);
    return this.mapToResponseDto(product);
  }

  async findAll(page = 1, limit = 10, search?: string): Promise<{ products: ProductResponseDto[]; total: number }> {
    const { products, total } = await this.productsRepository.findAll(page, limit, search);
    
    return {
      products: products.map(product => this.mapToResponseDto(product)),
      total
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(product);
  }

  async findBySku(sku: string): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundException(`Produit avec le SKU ${sku} non trouvé`);
    }

    return this.mapToResponseDto(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.productsRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'unicité du SKU si modifié
    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuExists = await this.productsRepository.findBySku(updateProductDto.sku);
      if (skuExists) {
        throw new ConflictException('Un produit avec ce SKU existe déjà');
      }
    }

    const updatedProduct = await this.productsRepository.update(id, updateProductDto);
    return this.mapToResponseDto(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    await this.productsRepository.delete(id);
  }

  async findByCategory(categoryId: string): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findByCategory(categoryId);
    return products.map(product => this.mapToResponseDto(product));
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      specifications: product.specifications,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
}