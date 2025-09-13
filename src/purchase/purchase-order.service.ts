import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPurchaseOrderDto: CreatePurchaseOrderDto) {
    const { items, ...orderData } = createPurchaseOrderDto;
    
    // Générer le numéro de commande
    const orderNumber = await this.generateOrderNumber();
    
    // Calculer le montant total
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return this.prisma.purchaseOrder.create({
      data: {
        ...orderData,
        number: orderNumber,
        totalAmount,
        userId,
        items: {
          create: items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
            vendorId: createPurchaseOrderDto.vendorId,
          }))
        }
      },
      include: {
        items: true,
        vendor: true,
        project: true,
        estimate: true,
      }
    });
  }

  async findAll(userId: string, projectId?: string) {
    const where: Prisma.PurchaseOrderWhereInput = {
      userId,
      ...(projectId && { projectId })
    };

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        project: true,
        items: true,
        estimate: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string, userId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, userId },
      include: {
        vendor: true,
        project: true,
        items: {
          include: {
            estimateItem: true
          }
        },
        estimate: true,
      }
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async update(id: string, userId: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
    const existingOrder = await this.findOne(id, userId);
    
    if (existingOrder.status !== 'DRAFT' && updatePurchaseOrderDto.items) {
      throw new BadRequestException('Cannot modify items of a sent purchase order');
    }

    const { items, ...orderData } = updatePurchaseOrderDto;
    
    let totalAmount = existingOrder.totalAmount;
    if (items) {
      totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...orderData,
        ...(totalAmount && { totalAmount }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map(item => ({
              ...item,
              totalPrice: item.quantity * item.unitPrice,
              vendorId: existingOrder.vendorId,
            }))
          }
        })
      },
      include: {
        items: true,
        vendor: true,
        project: true,
        estimate: true,
      }
    });
  }

  async remove(id: string, userId: string) {
    const purchaseOrder = await this.findOne(id, userId);
    
    if (purchaseOrder.status !== 'DRAFT') {
      throw new BadRequestException('Cannot delete a sent purchase order');
    }

    return this.prisma.purchaseOrder.delete({
      where: { id }
    });
  }

  async createFromEstimate(userId: string, estimateId: string, vendorId: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id: estimateId, userId },
      include: { items: true }
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    const createDto: CreatePurchaseOrderDto = {
      vendorId,
      projectId: estimate.projectId,
      estimateId,
      items: estimate.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        category: item.category,
        estimateItemId: item.id,
      }))
    };

    return this.create(userId, createDto);
  }

  async sendToVendor(id: string, userId: string) {
    const purchaseOrder = await this.findOne(id, userId);
    
    if (purchaseOrder.status !== 'DRAFT') {
      throw new BadRequestException('Purchase order has already been sent');
    }

    // Ici vous pouvez ajouter la logique d'envoi d'email au vendor
    // Par exemple: await this.emailService.sendPurchaseOrderToVendor(purchaseOrder);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'SENT',
        orderDate: new Date(),
      },
      include: {
        items: true,
        vendor: true,
        project: true,
      }
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const count = await this.prisma.purchaseOrder.count();
    return `PO-${String(count + 1).padStart(6, '0')}`;
  }
}
