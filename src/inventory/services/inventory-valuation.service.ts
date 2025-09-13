// src/inventory/services/inventory-valuation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { InventoryCalculatorUtil } from '../utils/inventory-calculator.util';

@Injectable()
export class InventoryValuationService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly inventoryCalculator: InventoryCalculatorUtil
  ) {}

  async calculateProductValue(productId: string, method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE') {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    const currentBalance = await this.inventoryRepository.getCurrentBalance(productId);
    if (currentBalance === 0) {
      return { quantity: 0, totalValue: 0, averageUnitCost: 0 };
    }

    const transactions = await this.inventoryRepository.getTransactionsForValuation(productId);
    
    switch (method) {
      case 'FIFO':
        return this.inventoryCalculator.calculateFIFOValue(transactions, currentBalance);
      case 'LIFO':
        return this.inventoryCalculator.calculateLIFOValue(transactions, currentBalance);
      case 'AVERAGE':
        return this.inventoryCalculator.calculateAverageValue(transactions, currentBalance);
      default:
        return this.inventoryCalculator.calculateAverageValue(transactions, currentBalance);
    }
  }

  async calculateTotalInventoryValue(method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE') {
    const products = await this.productsRepository.findActiveProducts();
    let totalValue = 0;
    const productValues = [];

    for (const product of products) {
      const productValue = await this.calculateProductValue(product.id, method);
      totalValue += productValue.totalValue;
      
      if (productValue.quantity > 0) {
        productValues.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          ...productValue
        });
      }
    }

    return {
      totalValue,
      method,
      products: productValues,
      calculatedAt: new Date()
    };
  }

  async getInventoryTurnover(productId: string, periodInDays: number = 365) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);

    const costOfGoodsSold = await this.inventoryRepository.getCostOfGoodsSold(
      productId, 
      startDate, 
      endDate
    );
    
    const averageInventoryValue = await this.inventoryRepository.getAverageInventoryValue(
      productId, 
      startDate, 
      endDate
    );

    if (averageInventoryValue === 0) {
      return { turnoverRatio: 0, daysSalesInInventory: 0 };
    }

    const turnoverRatio = costOfGoodsSold / averageInventoryValue;
    const daysSalesInInventory = periodInDays / turnoverRatio;

    return {
      productId,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysSalesInInventory: Math.round(daysSalesInInventory),
      costOfGoodsSold,
      averageInventoryValue,
      period: periodInDays,
      calculatedAt: new Date()
    };
  }

  async getSlowMovingItems(threshold: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - threshold);

    return this.inventoryRepository.getSlowMovingItems(cutoffDate);
  }

  async getDeadStock(threshold: number = 180) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - threshold);

    return this.inventoryRepository.getDeadStock(cutoffDate);
  }

  async getInventoryAging(productId?: string) {
    if (productId) {
      const product = await this.productsRepository.findById(productId);
      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
      }
    }

    return this.inventoryRepository.getInventoryAging(productId);
  }

  async getValuationReport(
    method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE',
    categoryId?: string
  ) {
    const totalInventory = await this.calculateTotalInventoryValue(method);
    const slowMovingItems = await this.getSlowMovingItems();
    const deadStock = await this.getDeadStock();

    let filteredProducts = totalInventory.products;
    if (categoryId) {
      const categoryProducts = await this.productsRepository.findByCategory(categoryId);
      const categoryProductIds = categoryProducts.map(p => p.id);
      filteredProducts = totalInventory.products.filter(p => 
        categoryProductIds.includes(p.productId)
      );
    }

    const categoryTotalValue = filteredProducts.reduce((sum, p) => sum + p.totalValue, 0);

    return {
      summary: {
        totalValue: categoryId ? categoryTotalValue : totalInventory.totalValue,
        totalProducts: filteredProducts.length,
        method,
        slowMovingCount: slowMovingItems.length,
        deadStockCount: deadStock.length
      },
      products: filteredProducts,
      slowMovingItems,
      deadStock,
      generatedAt: new Date()
    };
  }

  async getReorderPoints(productId?: string) {
    if (productId) {
      const product = await this.productsRepository.findById(productId);
      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
      }
    }

    return this.inventoryRepository.getReorderPoints(productId);
  }

  async calculateOptimalOrderQuantity(productId: string, annualDemand: number, orderingCost: number, holdingCost: number) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    const eoq = this.inventoryCalculator.calculateEOQ(annualDemand, orderingCost, holdingCost);
    const totalCost = this.inventoryCalculator.calculateTotalCost(annualDemand, orderingCost, holdingCost, eoq);

    return {
      productId,
      optimalOrderQuantity: Math.ceil(eoq),
      annualDemand,
      orderingCost,
      holdingCost,
      totalAnnualCost: totalCost,
      calculatedAt: new Date()
    };
  }
}