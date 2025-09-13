// src/inventory/services/product-vendors.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { VendorsRepository } from '../repositories/vendors.repository';
import { CreateProductVendorDto } from '../dtos/product-vendor/create-product-vendor.dto';
import { UpdateProductVendorDto } from '../dtos/product-vendor/update-product-vendor.dto';

@Injectable()
export class ProductVendorsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly vendorsRepository: VendorsRepository
  ) {}

  async createRelation(createDto: CreateProductVendorDto) {
    // Vérifier l'existence du produit
    const product = await this.productsRepository.findById(createDto.productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${createDto.productId} non trouvé`);
    }

    // Vérifier l'existence du fournisseur
    const vendor = await this.vendorsRepository.findById(createDto.vendorId);
    if (!vendor) {
      throw new NotFoundException(`Fournisseur avec l'ID ${createDto.vendorId} non trouvé`);
    }

    // Vérifier si la relation existe déjà
    const existingRelation = await this.productsRepository.findProductVendorRelation(
      createDto.productId, 
      createDto.vendorId
    );
    if (existingRelation) {
      throw new ConflictException('Cette relation produit-fournisseur existe déjà');
    }

    return this.productsRepository.createProductVendorRelation(createDto);
  }

  async updateRelation(productId: string, vendorId: string, updateDto: UpdateProductVendorDto) {
    const existingRelation = await this.productsRepository.findProductVendorRelation(productId, vendorId);
    if (!existingRelation) {
      throw new NotFoundException('Relation produit-fournisseur non trouvée');
    }

    return this.productsRepository.updateProductVendorRelation(productId, vendorId, updateDto);
  }

  async removeRelation(productId: string, vendorId: string): Promise<void> {
    const existingRelation = await this.productsRepository.findProductVendorRelation(productId, vendorId);
    if (!existingRelation) {
      throw new NotFoundException('Relation produit-fournisseur non trouvée');
    }

    await this.productsRepository.deleteProductVendorRelation(productId, vendorId);
  }

  async findVendorsByProduct(productId: string) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    return this.productsRepository.findVendorsByProduct(productId);
  }

  async findProductsByVendor(vendorId: string) {
    const vendor = await this.vendorsRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Fournisseur avec l'ID ${vendorId} non trouvé`);
    }

    return this.productsRepository.findProductsByVendor(vendorId);
  }

  async findBestPriceForProduct(productId: string) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    return this.productsRepository.findBestPriceForProduct(productId);
  }

  async findRelation(productId: string, vendorId: string) {
    const relation = await this.productsRepository.findProductVendorRelation(productId, vendorId);
    if (!relation) {
      throw new NotFoundException('Relation produit-fournisseur non trouvée');
    }

    return relation;
  }

  async findAllRelations(page = 1, limit = 10) {
    return this.productsRepository.findAllProductVendorRelations(page, limit);
  }
}