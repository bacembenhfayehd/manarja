// src/inventory/services/purchase-requisitions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchaseRequisitionsRepository } from '../repositories/purchase-requisitions.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { CreatePurchaseRequisitionDto } from '../dtos/requisition/create-purchase-requisition.dto';
import { CreateRequisitionItemDto } from '../dtos/requisition/create-requisition-item.dto';
import { PurchaseRequisitionResponseDto } from '../dtos/requisition/purchase-requisition-response.dto';
import { RequisitionStatus } from '../enums/requisition-status.enum';
import { Priority } from '../enums/priority.enum';

@Injectable()
export class PurchaseRequisitionsService {
  constructor(
    private readonly purchaseRequisitionsRepository: PurchaseRequisitionsRepository,
    private readonly productsRepository: ProductsRepository
  ) {}

  async create(createDto: CreatePurchaseRequisitionDto): Promise<PurchaseRequisitionResponseDto> {
    // Valider les items de la requisition
    await this.validateRequisitionItems(createDto.items);

    // Générer un numéro de requisition automatique
    const requisitionNumber = await this.generateRequisitionNumber();
    
    const requisitionData = {
      ...createDto,
      requisitionNumber,
      status: RequisitionStatus.DRAFT
    };

    const requisition = await this.purchaseRequisitionsRepository.create(requisitionData);
    return this.mapToResponseDto(requisition);
  }

  async findAll(
    page = 1, 
    limit = 10, 
    status?: RequisitionStatus,
    priority?: Priority
  ): Promise<{ requisitions: PurchaseRequisitionResponseDto[]; total: number }> {
    const { requisitions, total } = await this.purchaseRequisitionsRepository.findAll(
      page, 
      limit, 
      status, 
      priority
    );
    
    return {
      requisitions: requisitions.map(req => this.mapToResponseDto(req)),
      total
    };
  }

  async findOne(id: string): Promise<PurchaseRequisitionResponseDto> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(requisition);
  }

  async findByNumber(requisitionNumber: string): Promise<PurchaseRequisitionResponseDto> {
    const requisition = await this.purchaseRequisitionsRepository.findByNumber(requisitionNumber);
    if (!requisition) {
      throw new NotFoundException(`Requisition ${requisitionNumber} non trouvée`);
    }

    return this.mapToResponseDto(requisition);
  }

  async submit(id: string): Promise<PurchaseRequisitionResponseDto> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException('Seules les requisitions en brouillon peuvent être soumises');
    }

    if (!requisition.items || requisition.items.length === 0) {
      throw new BadRequestException('La requisition doit contenir au moins un item');
    }

    const updatedRequisition = await this.purchaseRequisitionsRepository.updateStatus(
      id, 
      RequisitionStatus.SUBMITTED
    );
    
    return this.mapToResponseDto(updatedRequisition);
  }

  async approve(id: string, approverId: string): Promise<PurchaseRequisitionResponseDto> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    if (requisition.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException('Seules les requisitions soumises peuvent être approuvées');
    }

    const updatedRequisition = await this.purchaseRequisitionsRepository.approve(id, approverId);
    return this.mapToResponseDto(updatedRequisition);
  }

  async reject(id: string, rejectionReason: string): Promise<PurchaseRequisitionResponseDto> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    if (requisition.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException('Seules les requisitions soumises peuvent être rejetées');
    }

    const updatedRequisition = await this.purchaseRequisitionsRepository.reject(id, rejectionReason);
    return this.mapToResponseDto(updatedRequisition);
  }

  async addItem(id: string, createItemDto: CreateRequisitionItemDto) {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException('Seules les requisitions en brouillon peuvent être modifiées');
    }

    // Vérifier l'existence du produit
    const product = await this.productsRepository.findById(createItemDto.productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${createItemDto.productId} non trouvé`);
    }

    return this.purchaseRequisitionsRepository.addItem(id, createItemDto);
  }

  async removeItem(id: string, itemId: string): Promise<void> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    if (requisition.status !== RequisitionStatus.DRAFT) {
      throw new BadRequestException('Seules les requisitions en brouillon peuvent être modifiées');
    }

    await this.purchaseRequisitionsRepository.removeItem(id, itemId);
  }

  async calculateTotal(id: string): Promise<number> {
    const requisition = await this.purchaseRequisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException(`Requisition avec l'ID ${id} non trouvée`);
    }

    return this.purchaseRequisitionsRepository.calculateTotal(id);
  }

  async findByProject(projectId: string): Promise<PurchaseRequisitionResponseDto[]> {
    const requisitions = await this.purchaseRequisitionsRepository.findByProject(projectId);
    return requisitions.map(req => this.mapToResponseDto(req));
  }

  private async validateRequisitionItems(items: CreateRequisitionItemDto[]): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException('La requisition doit contenir au moins un item');
    }

    for (const item of items) {
      const product = await this.productsRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${item.productId} non trouvé`);
      }

      if (item.quantity <= 0) {
        throw new BadRequestException('La quantité doit être positive');
      }
    }
  }

  private async generateRequisitionNumber(): Promise<string> {
    const count = await this.purchaseRequisitionsRepository.count();
    const year = new Date().getFullYear();
    return `PR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private mapToResponseDto(requisition: any): PurchaseRequisitionResponseDto {
    return {
      id: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
      projectId: requisition.projectId,
      requestedBy: requisition.requestedBy,
      description: requisition.description,
      priority: requisition.priority,
      requiredDate: requisition.requiredDate,
      status: requisition.status,
      items: requisition.items,
      totalAmount: requisition.totalAmount,
      approvedBy: requisition.approvedBy,
      approvedAt: requisition.approvedAt,
      rejectionReason: requisition.rejectionReason,
      notes: requisition.notes,
      createdAt: requisition.createdAt,
      updatedAt: requisition.updatedAt
    };
  }
}