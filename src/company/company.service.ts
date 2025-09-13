import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

    async create(createCompanyDto: CreateCompanyDto) {
    try {
     
      await this.validateCompanyData(createCompanyDto);

      const existingCompany = await this.prisma.company.findFirst({
        where: {
          name: {
            equals: createCompanyDto.name,
            mode: Prisma.QueryMode.insensitive, 
          },
          deletedAt: null, 
        },
      });

      if (existingCompany) {
        throw new ConflictException(
          `Company with name "${createCompanyDto.name}" already exists`
        );
      }

      
      const company = await this.prisma.company.create({
        data: {
          name: createCompanyDto.name,
          description: createCompanyDto.description,
          website: createCompanyDto.website,
          contactInfo: createCompanyDto.contactInfo,
          businessDetails: createCompanyDto.businessDetails,
          settings: createCompanyDto.settings,
        },
        
        include: {
          userCompanies: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          branding: true,
          fatooraSettings: true,
        },
      });

      return {
        success: true,
        message: 'Company created successfully',
        data: company,
      };

    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Gérer les erreurs Prisma spécifiques
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            // Unique constraint violation
            throw new ConflictException('Company with this information already exists');
          case 'P2025':
            // Record not found
            throw new BadRequestException('Related record not found');
          default:
            throw new BadRequestException(`Database error: ${error.message}`);
        }
      }

      // Autres erreurs inattendues
      console.error('Unexpected error creating company:', error);
      throw new BadRequestException('Failed to create company. Please try again.');
    }
  }

  // Méthode de validation privée
  private async validateCompanyData(createCompanyDto: CreateCompanyDto): Promise<void> {
    const errors: string[] = [];

    // Validation du nom
    if (!createCompanyDto.name?.trim()) {
      errors.push('Company name cannot be empty');
    }

    if (createCompanyDto.name && createCompanyDto.name.length > 255) {
      errors.push('Company name cannot exceed 255 characters');
    }

    // Validation de l'URL du site web
    if (createCompanyDto.website) {
      try {
        new URL(createCompanyDto.website);
      } catch {
        errors.push('Invalid website URL format');
      }
    }

    // Validation des champs JSON
    if (createCompanyDto.contactInfo) {
      this.validateJsonField(createCompanyDto.contactInfo, 'contactInfo', errors);
    }

    if (createCompanyDto.businessDetails) {
      this.validateJsonField(createCompanyDto.businessDetails, 'businessDetails', errors);
    }

    if (createCompanyDto.settings) {
      this.validateJsonField(createCompanyDto.settings, 'settings', errors);
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  // Validation des champs JSON
  private validateJsonField(
    field: Record<string, any>,
    fieldName: string,
    errors: string[]
  ): void {
    if (typeof field !== 'object' || field === null || Array.isArray(field)) {
      errors.push(`${fieldName} must be a valid JSON object`);
      return;
    }

    // Validation spécifique pour contactInfo
    if (fieldName === 'contactInfo') {
      const { email, phone } = field;
      
      if (email && typeof email !== 'string') {
        errors.push('Contact email must be a string');
      }
      
      if (email && !this.isValidEmail(email)) {
        errors.push('Invalid contact email format');
      }
      
      if (phone && typeof phone !== 'string') {
        errors.push('Contact phone must be a string');
      }
    }

    if (fieldName === 'businessDetails') {
      const { foundedYear } = field;
      
      if (foundedYear && (typeof foundedYear !== 'number' || foundedYear < 1800 || foundedYear > new Date().getFullYear())) {
        errors.push('Founded year must be a valid year between 1800 and current year');
      }
    }
  }


   private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    
    const where: Prisma.CompanyWhereInput = search
      ? {
          OR: [
            { 
              name: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              } 
            },
            { 
              description: { 
                contains: search, 
                mode: Prisma.QueryMode.insensitive 
              } 
            },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
       
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        branding: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    // Soft delete implementation
    return this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Branding methods
  async getBranding(companyId: string) {
    return this.prisma.companyBranding.findUnique({
      where: { companyId },
    });
  }

  async updateBranding(companyId: string, brandingData: any) {
    return this.prisma.companyBranding.upsert({
      where: { companyId },
      update: brandingData,
      create: {
        companyId,
        ...brandingData,
      },
    });
  }
}