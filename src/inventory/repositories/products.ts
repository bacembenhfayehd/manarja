export class Products {}
import { Injectable } from '@nestjs/common';

import { Product, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(filters?: {
    category?: string;
    isActive?: boolean;
    vendorId?: string;
  }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.category) where.category = filters.category;
    if (filters?.vendorId) {
      where.productVendors = {
        some: { vendorId: filters.vendorId },
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        productVendors: {
          include: { vendor: true },
        },
        inventoryBalances: true,
      },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        productVendors: {
          include: { vendor: true },
        },
        inventoryBalances: true,
        takeoffItems: true,
      },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({
      data,
      include: {
        productVendors: {
          include: { vendor: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        productVendors: {
          include: { vendor: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async findLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        inventoryBalances: {
          some: {
            currentQuantity: {
              lt: threshold,
            },
          },
        },
      },
      include: {
        inventoryBalances: true,
      },
    });
  }
}
