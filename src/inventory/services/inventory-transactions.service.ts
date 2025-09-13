// src/inventory/services/inventory-transactions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateInventoryTransactionDto } from '../dtos/inventory/create-inventory-transaction.dto';
import { TransactionType } from '../enums/transaction-type.enum';

@Injectable()
export class InventoryTransactionsService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsRepository: ProductsRepository
  ) {}

  async createTransaction(createDto: CreateInventoryTransactionDto) {
    // Vérifier l'existence du produit
    const product = await this.productsRepository.findById(createDto.productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${createDto.productId} non trouvé`);
    }

    // Vérifier la quantité pour les sorties
    if (createDto.type === TransactionType.OUT) {
      const currentBalance = await this.inventoryRepository.getCurrentBalance(createDto.productId);
      if (currentBalance < createDto.quantity) {
        throw new BadRequestException('Stock insuffisant pour cette sortie');
      }
    }

    // Valider la quantité
    if (createDto.quantity <= 0) {
      throw new BadRequestException('La quantité doit être positive');
    }

    return this.inventoryRepository.createTransaction(createDto);
  }

  async findTransactionsByProduct(
    productId: string, 
    page = 1, 
    limit = 10
  ) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    return this.inventoryRepository.findTransactionsByProduct(productId, page, limit);
  }

  async findTransactionsByDateRange(
    startDate: Date, 
    endDate: Date, 
    page = 1, 
    limit = 10
  ) {
    if (startDate > endDate) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    return this.inventoryRepository.findTransactionsByDateRange(startDate, endDate, page, limit);
  }

  async findTransactionsByType(
    type: TransactionType, 
    page = 1, 
    limit = 10
  ) {
    return this.inventoryRepository.findTransactionsByType(type, page, limit);
  }

  async getCurrentBalance(productId: string): Promise<number> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    return this.inventoryRepository.getCurrentBalance(productId);
  }

  async getBalanceAtDate(productId: string, date: Date): Promise<number> {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    return this.inventoryRepository.getBalanceAtDate(productId, date);
  }

  async findTransaction(id: string) {
    const transaction = await this.inventoryRepository.findTransactionById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction avec l'ID ${id} non trouvée`);
    }

    return transaction;
  }

  async findAllTransactions(page = 1, limit = 10) {
    return this.inventoryRepository.findAllTransactions(page, limit);
  }

  async getMovementSummary(productId: string, startDate: Date, endDate: Date) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    if (startDate > endDate) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    return this.inventoryRepository.getMovementSummary(productId, startDate, endDate);
  }

  async getLowStockProducts(threshold: number = 10) {
    if (threshold < 0) {
      throw new BadRequestException('Le seuil doit être positif ou nul');
    }

    return this.inventoryRepository.getLowStockProducts(threshold);
  }

  async adjustStock(productId: string, newQuantity: number, reason: string, userId: string) {
    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
    }

    if (newQuantity < 0) {
      throw new BadRequestException('La nouvelle quantité ne peut pas être négative');
    }

    const currentBalance = await this.inventoryRepository.getCurrentBalance(productId);
    const adjustment = newQuantity - currentBalance;

    if (adjustment === 0) {
      throw new BadRequestException('Aucun ajustement nécessaire');
    }

    const transactionDto: CreateInventoryTransactionDto = {
      productId,
      type: adjustment > 0 ? TransactionType.ADJUSTMENT_IN : TransactionType.ADJUSTMENT_OUT,
      quantity: Math.abs(adjustment),
      reference: `ADJ-${Date.now()}`,
      notes: reason,
      userId
    };

    return this.inventoryRepository.createTransaction(transactionDto);
  }