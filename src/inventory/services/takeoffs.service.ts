// src/inventory/services/takeoffs.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TakeoffsRepository } from '../repositories/takeoffs.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateTakeoffDto } from '../dtos/takeoff/create-takeoff.dto';
import { CreateTakeoffItemDto } from '../dtos/takeoff/create-takeoff-item.dto';
import { TakeoffResponseDto } from '../dtos/takeoff/takeoff-response.dto';

@Injectable()
export class TakeoffsService {
  constructor(
    private readonly takeoffsRepository: TakeoffsRepository,
    private readonly productsRepository: ProductsRepository
  ) {}

  async create(createTakeoffDto: CreateTakeoffDto): Promise<TakeoffResponseDto> {
    // Valider les items du takeoff
    await this.validateTakeoffItems(createTakeoffDto.items);

    const takeoff = await this.takeoffsRepository.create(createTakeoffDto);
    return this.mapToResponseDto(takeoff);
  }

  async findAll(page = 1, limit = 10, projectId?: string): Promise<{ takeoffs: TakeoffResponseDto[]; total: number }> {
    const { takeoffs, total } = await this.takeoffsRepository.findAll(page, limit, projectId);
    
    return {
      takeoffs: takeoffs.map(takeoff => this.mapToResponseDto(takeoff)),
      total
    };
  }

  async findOne(id: string): Promise<TakeoffResponseDto> {
    const takeoff = await this.takeoffsRepository.findById(id);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(takeoff);
  }

  async addItem(takeoffId: string, createItemDto: CreateTakeoffItemDto) {
    const takeoff = await this.takeoffsRepository.findById(takeoffId);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${takeoffId} non trouvé`);
    }

    // Vérifier l'existence du produit
    const product = await this.productsRepository.findById(createItemDto.productId);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${createItemDto.productId} non trouvé`);
    }

    return this.takeoffsRepository.addItem(takeoffId, createItemDto);
  }

  async removeItem(takeoffId: string, itemId: string): Promise<void> {
    const takeoff = await this.takeoffsRepository.findById(takeoffId);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${takeoffId} non trouvé`);
    }

    await this.takeoffsRepository.removeItem(takeoffId, itemId);
  }

  async updateItem(takeoffId: string, itemId: string, updateData: Partial<CreateTakeoffItemDto>) {
    const takeoff = await this.takeoffsRepository.findById(takeoffId);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${takeoffId} non trouvé`);
    }

    return this.takeoffsRepository.updateItem(takeoffId, itemId, updateData);
  }

  async convertToRequisition(takeoffId: string) {
    const takeoff = await this.takeoffsRepository.findById(takeoffId);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${takeoffId} non trouvé`);
    }

    if (!takeoff.items || takeoff.items.length === 0) {
      throw new BadRequestException('Le takeoff doit contenir au moins un item pour être converti');
    }

    return this.takeoffsRepository.convertToRequisition(takeoffId);
  }

  async calculateTotalCost(takeoffId: string): Promise<number> {
    const takeoff = await this.takeoffsRepository.findById(takeoffId);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${takeoffId} non trouvé`);
    }

    return this.takeoffsRepository.calculateTotalCost(takeoffId);
  }

  async findByProject(projectId: string): Promise<TakeoffResponseDto[]> {
    const takeoffs = await this.takeoffsRepository.findByProject(projectId);
    return takeoffs.map(takeoff => this.mapToResponseDto(takeoff));
  }

  async remove(id: string): Promise<void> {
    const takeoff = await this.takeoffsRepository.findById(id);
    if (!takeoff) {
      throw new NotFoundException(`Takeoff avec l'ID ${id} non trouvé`);
    }

    await this.takeoffsRepository.delete(id);
  }

  private async validateTakeoffItems(items: CreateTakeoffItemDto[]): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Le takeoff doit contenir au moins un item');
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

  private mapToResponseDto(takeoff: any): TakeoffResponseDto {
    return {
      id: takeoff.id,
      name: takeoff.name,
      description: takeoff.description,
      projectId: takeoff.projectId,
      phase: takeoff.phase,
      items: takeoff.items,
      totalCost: takeoff.totalCost,
      status: takeoff.status,
      createdAt: takeoff.createdAt,
      updatedAt: takeoff.updatedAt
    };
  }
}