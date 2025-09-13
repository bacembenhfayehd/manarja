import { Injectable } from '@nestjs/common';

import { Vendor, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class VendorsRepository extends BaseRepository<Vendor> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(filters?: {
    isActive?: boolean;
    country?: string;
  }): Promise<Vendor[]> {
    const where: Prisma.VendorWhereInput = {};
    
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.country) where.country = filters.country;

    return this.prisma.vendor.findMany({
      where,
      include: {
        productVendors: {
          include: { product: true }
        }
      }
    });
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({
      where: { id },
      include: {
        productVendors: {
          include: { product: true }
        },
        purchaseRequisitions: true
      }
    });
  }

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({
      data,
      include: {
        productVendors: {
          include: { product: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.VendorUpdateInput): Promise<Vendor> {
    return this.prisma.vendor.update({
      where: { id },
      data,
      include: {
        productVendors: {
          include: { product: true }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vendor.delete({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<Vendor | null> {
    return this.prisma.vendor.findUnique({
      where: { email }
    });
  }
}
