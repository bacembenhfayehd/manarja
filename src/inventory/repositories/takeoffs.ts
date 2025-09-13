export class Takeoffs {}
import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Takeoff } from '@prisma/client';


@Injectable()
export class TakeoffsRepository extends BaseRepository<Takeoff> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(filters?: {
    projectId?: string;
    createdBy?: string;
  }): Promise<Takeoff[]> {
    const where: Prisma.TakeoffWhereInput = {};
    
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.createdBy) where.createdBy = filters.createdBy;

    return this.prisma.takeoff.findMany({
      where,
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  async findById(id: string): Promise<Takeoff | null> {
    return this.prisma.takeoff.findUnique({
      where: { id },
      include: {
        items: {
          include: { 
            product: {
              include: {
                productVendors: {
                  include: { vendor: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async create(data: Prisma.TakeoffCreateInput): Promise<Takeoff> {
    return this.prisma.takeoff.create({
      data,
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.TakeoffUpdateInput): Promise<Takeoff> {
    return this.prisma.takeoff.update({
      where: { id },
      data,
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.takeoff.delete({
      where: { id }
    });
  }

  async findByProject(projectId: string): Promise<Takeoff[]> {
    return this.prisma.takeoff.findMany({
      where: { projectId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  async convertToPurchaseRequisition(takeoffId: string): Promise<any> {
    
    const takeoff = await this.findById(takeoffId);
    if (!takeoff) throw new Error('Takeoff not found');

    return this.prisma.$transaction(async (prisma) => {
      
      const itemsByVendor = takeoff.items.reduce((acc, item) => {
        const vendorId = item.product.productVendors[0]?.vendorId;
        if (!vendorId) return acc;
        
        if (!acc[vendorId]) acc[vendorId] = [];
        acc[vendorId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Créer une requisition par vendor
      const requisitions = [];
      for (const [vendorId, items] of Object.entries(itemsByVendor)) {
        const requisition = await prisma.purchaseRequisition.create({
          data: {
            takeoffId,
            status: 'DRAFT',
            totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
            requisitionItems: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          }
        });
        requisitions.push(requisition);
      }

      return requisitions;
    });
  }
}