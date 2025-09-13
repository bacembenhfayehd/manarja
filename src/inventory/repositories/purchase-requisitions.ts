import { Injectable } from '@nestjs/common';

import { PurchaseRequisition, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PurchaseRequisitionsRepository extends BaseRepository<PurchaseRequisition> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(filters?: {
    projectId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PurchaseRequisition[]> {
    const where: Prisma.PurchaseRequisitionWhereInput = {};
    
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status as any;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return this.prisma.purchaseRequisition.findMany({
      where,
      include: {
        company: true, 
        project: true,
        items: { 
          include: { 
             product:true// product: true // Vérifier si RequisitionItem a une relation product
          }
        },
        takeoff: true
      }
    });
  }

  async findById(id: string): Promise<PurchaseRequisition | null> {
    return this.prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        company: true, 
        project: true,
        items: { 
          include: { 
             product:true
          }
        },
        takeoff: true
        
      }
    });
  }

  async create(data: Prisma.PurchaseRequisitionCreateInput): Promise<PurchaseRequisition> {
    return this.prisma.purchaseRequisition.create({
      data,
      include: {
        company: true, 
        project: true,
        items: { 
          include: { 
             product:true
          }
        },
        takeoff: true
        
      }
    });
  }

  async update(id: string, data: Prisma.PurchaseRequisitionUpdateInput): Promise<PurchaseRequisition> {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data,
     include: {
        company: true, 
        project: true,
        items: { 
          include: { 
             product:true
          }
        },
        takeoff: true
        
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.purchaseRequisition.delete({
      where: { id }
    });
  }

  async approve(id: string, approvedBy: string): Promise<PurchaseRequisition> {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      }
    });
  }

  async reject(id: string, rejectionReason: string): Promise<PurchaseRequisition> {
  return this.prisma.purchaseRequisition.update({
    where: { id },
    data: {
      status: 'REJECTED',
      notes: rejectionReason 
    }
  });
}
}