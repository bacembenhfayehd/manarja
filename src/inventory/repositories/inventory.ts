import { Injectable } from '@nestjs/common';

import { InventoryTransaction, InventoryBalance, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Transactions
  async createTransaction(data: Prisma.InventoryTransactionCreateInput): Promise<InventoryTransaction> {
    return this.prisma.$transaction(async (prisma) => {
      // Créer la transaction
      const transaction = await prisma.inventoryTransaction.create({
        data,
        include: {
          product: true
        }
      });

      // Mettre à jour le balance
      await this.updateInventoryBalance(
        transaction.productId,
        transaction.type,
        Number(transaction.quantity),
        Number(transaction.unitCost)
      );

      return transaction;
    });
  }

  async findTransactions(filters?: {
    productId?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<InventoryTransaction[]> {
    const where: Prisma.InventoryTransactionWhereInput = {};
    
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.type) where.type = filters.type as any ;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Balances
  async getInventoryBalance(productId: string): Promise<InventoryBalance | null> {
    return this.prisma.inventoryBalance.findFirst({
      where: { productId },
      include: {
        product: true
      }
    });
  }

  async getAllBalances(filters?: {
    lowStock?: boolean;
    threshold?: number;
  }): Promise<InventoryBalance[]> {
    const where: Prisma.InventoryBalanceWhereInput = {};
    
    if (filters?.lowStock && filters?.threshold) {
      where.currentQuantity = {
        lt: filters.threshold
      };
    }

    return this.prisma.inventoryBalance.findMany({
      where,
      include: {
        product: {
          include: {
            productVendors: {
              include: { vendor: true }
            }
          }
        }
      }
    });
  }

  private async updateInventoryBalance(
    productId: string,
    transactionType: string,
    quantity: number,
    unitCost: number
  ): Promise<void> {
    const existingBalance = await this.prisma.inventoryBalance.findFirst({
      where: { productId }
    });

    if (!existingBalance) {
      // Créer un nouveau balance
       const newQuantity = transactionType === 'IN' ? quantity : -quantity;
      await this.prisma.inventoryBalance.create({
        data: {
          companyId:'COMPANY ID',
          productId,
          currentQuantity: newQuantity,
          averageCost: unitCost,
          availableQuantity: newQuantity,
          totalValue: unitCost * quantity,
          lastTransactionAt: new Date()
        }
      });
    } else {
      // Mettre à jour le balance existant
      const newQuantity = transactionType === 'IN' 
        ? Number(existingBalance.currentQuantity) + quantity 
        : Number(existingBalance.currentQuantity) - quantity;

      let newAverageCost = Number(existingBalance.averageCost);
      if (transactionType === 'IN' && newQuantity > 0) {
        // Calcul du coût moyen pondéré
        const totalValue = (Number(existingBalance.currentQuantity) * Number(existingBalance.averageCost)) + (quantity * unitCost);
        newAverageCost = totalValue / newQuantity;
      }

      await this.prisma.inventoryBalance.update({
        where: { id:existingBalance.id },
        data: {
          currentQuantity: newQuantity,
          averageCost: newAverageCost,
          totalValue: newQuantity * newAverageCost,
          lastTransactionAt: new Date()
        }
      });
    }
  }

  // Valorisation
  async getInventoryValuation(): Promise<{
    totalValue: number;
    totalQuantity: number;
    productCount: number;
  }> {
    const result = await this.prisma.inventoryBalance.aggregate({
      _sum: {
        totalValue: true,
        currentQuantity: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalValue: Number(result._sum.totalValue) || 0,
      totalQuantity: Number(result._sum.currentQuantity) || 0,
      productCount: result._count.id || 0
    };
  }
}