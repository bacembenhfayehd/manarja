import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VendorsRepository } from '../repositories/vendors.repository';
import { CreateVendorDto } from '../dtos/vendor/create-vendor.dto';
import { UpdateVendorDto } from '../dtos/vendor/update-vendor.dto';
import { VendorResponseDto } from '../dtos/vendor/vendor-response.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  async create(createVendorDto: CreateVendorDto): Promise<VendorResponseDto> {
    
    const existingVendor = await this.vendorsRepository.findByEmail(createVendorDto.email);
    if (existingVendor) {
      throw new ConflictException('Un fournisseur avec cet email existe déjà');
    }

    const vendor = await this.vendorsRepository.create(createVendorDto);
    return this.mapToResponseDto(vendor);
  }

  async findAll(page = 1, limit = 10, search?: string): Promise<{ vendors: VendorResponseDto[]; total: number }> {
    const { vendors, total } = await this.vendorsRepository.findAll(page, limit, search);
    
    return {
      vendors: vendors.map(vendor => this.mapToResponseDto(vendor)),
      total
    };
  }

  async findOne(id: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(vendor);
  }

  async findByEmail(email: string): Promise<VendorResponseDto> {
    const vendor = await this.vendorsRepository.findByEmail(email);
    if (!vendor) {
      throw new NotFoundException(`Fournisseur avec l'email ${email} non trouvé`);
    }

    return this.mapToResponseDto(vendor);
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<VendorResponseDto> {
    const existingVendor = await this.vendorsRepository.findById(id);
    if (!existingVendor) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateVendorDto.email && updateVendorDto.email !== existingVendor.email) {
      const emailExists = await this.vendorsRepository.findByEmail(updateVendorDto.email);
      if (emailExists) {
        throw new ConflictException('Un fournisseur avec cet email existe déjà');
      }
    }

    const updatedVendor = await this.vendorsRepository.update(id, updateVendorDto);
    return this.mapToResponseDto(updatedVendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.vendorsRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }

    await this.vendorsRepository.delete(id);
  }

  async findActiveVendors(): Promise<VendorResponseDto[]> {
    const vendors = await this.vendorsRepository.findActiveVendors();
    return vendors.map(vendor => this.mapToResponseDto(vendor));
  }

  async findByCategory(category: string): Promise<VendorResponseDto[]> {
    const vendors = await this.vendorsRepository.findByCategory(category);
    return vendors.map(vendor => this.mapToResponseDto(vendor));
  }

  private mapToResponseDto(vendor: any): VendorResponseDto {
    return {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      contactPerson: vendor.contactPerson,
      paymentTerms: vendor.paymentTerms,
      category: vendor.category,
      isActive: vendor.isActive,
      rating: vendor.rating,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt
    };
  }
}