import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateBrandingDto } from './dto/update-branding.dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service'; // supposed that i have service to handel uploads
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BrandingService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService
  ) {}

  async getBranding(companyId: string) {
    const branding = await this.prisma.companyBranding.findUnique({
      where: { companyId },
    });

    if (!branding) {
      throw new NotFoundException('Branding not found for this company');
    }

    return branding;
  }

  async updateBranding(companyId: string, dto: UpdateBrandingDto) {
    return this.prisma.companyBranding.upsert({
      where: { companyId },
      update: dto,
      create: {
        companyId,
        ...dto,
      },
    });
  }

  async uploadLogo(companyId: string, file: Express.Multer.File) {
    // Vérifier que la compagnie existe
    await this.validateCompanyExists(companyId);

    // Upload vers Cloudinary/S3/etc
    const uploadResult = await this.cloudinary.uploadImage(file);

    // Mettre à jour le logo dans la base de données
    return this.prisma.companyBranding.upsert({
      where: { companyId },
      update: { logoUrl: uploadResult.secure_url },
      create: {
        companyId,
        logoUrl: uploadResult.secure_url,
      },
    });
  }

  async uploadFavicon(companyId: string, file: Express.Multer.File) {
    await this.validateCompanyExists(companyId);

    const uploadResult = await this.cloudinary.uploadImage(file, {
      transformation: { width: 32, height: 32 }, // Dimensions spécifiques pour favicon
    });

    return this.prisma.companyBranding.upsert({
      where: { companyId },
      update: { faviconUrl: uploadResult.secure_url },
      create: {
        companyId,
        faviconUrl: uploadResult.secure_url,
      },
    });
  }

  private async validateCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }
}