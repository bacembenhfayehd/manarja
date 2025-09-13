import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';

@Injectable()
export class EstimatesService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, createEstimateDto: CreateEstimateDto) {
    const { items, ...estimateData } = createEstimateDto;

    const estimateNumber = await this.generateEstimateNumber();

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );
    const taxAmount = subtotal * 0.2;
    const totalAmount = subtotal + taxAmount;

    const project = await this.prisma.project.findUnique({
      where: { id: estimateData.projectId },
      select: { clientId: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return this.prisma.estimate.create({
      data: {
        ...estimateData,
        estimateNumber,
        subtotal,
        taxAmount,
        totalAmount,
        clientId: project.clientId,
        status: 'DRAFT',
        validUntil: estimateData.validUntil
          ? new Date(estimateData.validUntil)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: items.map((item, index) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.quantity) * Number(item.unitPrice),
            unitType: item.category || 'unit',
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        items: true,
        project: true,
        client: true,
      },
    });
  }

  async findAll(clientId: string, projectId?: string) {
    const where: Prisma.EstimateWhereInput = {
      project: {
        clientId,
      },
      ...(projectId && { projectId }),
    };

    return this.prisma.estimate.findMany({
      where,
      include: {
        items: true,
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, clientId: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: {
        id,
        project: {
          clientId,
        },
      },
      include: {
        items: true,
        project: true,
        client: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    return estimate;
  }

  async update(
    id: string,
    userId: string,
    updateEstimateDto: UpdateEstimateDto,
  ) {
    const existingEstimate = await this.findOne(id, userId);

    if (existingEstimate.status !== 'DRAFT' && updateEstimateDto.items) {
      throw new BadRequestException('Cannot modify items of a sent estimate');
    }

    const { items, ...estimateData } = updateEstimateDto;

    // Calculer les montants si les items sont modifiés
    let subtotal = Number(existingEstimate.subtotal);
    let taxAmount = Number(existingEstimate.taxAmount);
    let totalAmount = Number(existingEstimate.totalAmount);

    if (items) {
      subtotal = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0,
      );
      // Recalculer taxAmount selon votre logique
      taxAmount = 0; // ou votre logique de calcul de taxe
      totalAmount = subtotal + taxAmount;
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        ...estimateData,
        ...(items && {
          subtotal,
          taxAmount,
          totalAmount,
          items: {
            deleteMany: {},
            create: items.map((item, index) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
              unitType: item.category || 'unit',
              sortOrder: index + 1,
            })),
          },
        }),
      },
      include: {
        items: true,
        project: true,
        client: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const estimate = await this.findOne(id, userId);

    if (estimate.status !== 'DRAFT') {
      throw new BadRequestException('Cannot delete a sent estimate');
    }

    return this.prisma.estimate.delete({
      where: { id },
    });
  }

  async sendToClient(id: string, userId: string) {
    const estimate = await this.findOne(id, userId);

    if (estimate.status !== 'DRAFT') {
      throw new BadRequestException('Estimate has already been sent');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: 'SENT',
      },
      include: {
        items: true,
        project: true,
      },
    });
  }

  async approve(id: string, userId: string) {
    const estimate = await this.findOne(id, userId);

    if (estimate.status !== 'SENT') {
      throw new BadRequestException('Only sent estimates can be approved');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
      include: {
        items: true,
        project: true,
      },
    });
  }

  async reject(id: string, userId: string) {
    const estimate = await this.findOne(id, userId);

    if (estimate.status !== 'SENT') {
      throw new BadRequestException('Only sent estimates can be rejected');
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
      include: {
        items: true,
        project: true,
      },
    });
  }

  async duplicate(id: string, clientId: string) {
    const originalEstimate = await this.prisma.estimate.findFirst({
      where: {
        id,
        project: {
          clientId,
        },
      },
      include: {
        items: true,
        project: true,
        client: true,
      },
    });

    if (!originalEstimate) {
      throw new NotFoundException('Estimate not found');
    }

    const duplicateData: CreateEstimateDto = {
      title: `${originalEstimate.title} (Copy)`,
      description: originalEstimate.description,
      projectId: originalEstimate.projectId,
      items: originalEstimate.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        category: item.unitType,
      })),
    };

    return this.create(clientId, duplicateData);
  }

  async getEstimateStats(clientId: string, projectId?: string) {
    const where: Prisma.EstimateWhereInput = {
      clientId,
      ...(projectId && { projectId }),
    };

    const [total, draft, sent, approved, rejected] = await Promise.all([
      this.prisma.estimate.count({ where }),
      this.prisma.estimate.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.estimate.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.estimate.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.estimate.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    const totalValue = await this.prisma.estimate.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { totalAmount: true },
    });

    return {
      total,
      draft,
      sent,
      approved,
      rejected,
      totalApprovedValue: totalValue._sum.totalAmount || 0,
    };
  }

  private async generateEstimateNumber(): Promise<string> {
    const count = await this.prisma.estimate.count();
    return `EST-${String(count + 1).padStart(6, '0')}`;
  }
}
