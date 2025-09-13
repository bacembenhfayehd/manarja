import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetTrackingDto } from '../dto/create-budget-tracking.dto';
import { BudgetTrackingQueryDto } from '../dto/budget-tracking-query.dto';
import { UpdateBudgetTrackingDto } from '../dto/update-budget-tracking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetTrackingService {
  constructor(private prisma: PrismaService) {}

  async createBudgetTracking(
    projectId: string,
    createDto: CreateBudgetTrackingDto,
    userId: string,
  ) {
    await this.verifyProjectAccess(projectId, userId);

    return this.prisma.budgetTracking.create({
      data: {
        projectId,
        lastUpdated: new Date(),
        budgetedAmount: createDto.budgetedAmount,
        actualSpent: createDto.actualSpent,
        committedAmount: createDto.committedAmount || 0,
        variance: createDto.budgetedAmount - createDto.actualSpent,
        budgetCategory: createDto.budgetCategory || 'general',
      },
    });
  }

  async getProjectBudgetTrackings(
    projectId: string,
    query: BudgetTrackingQueryDto,
  ) {
    const { page = 1, limit = 10, startDate, endDate } = query;

    const where = {
      projectId,
      ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate) } }),
    };

    const [trackings, total] = await Promise.all([
      this.prisma.budgetTracking.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.budgetTracking.count({ where }),
    ]);

    return {
      data: trackings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBudgetTrackingById(id: string, userId: string) {
    const tracking = await this.prisma.budgetTracking.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!tracking) {
      throw new NotFoundException('Budget tracking record not found');
    }

    await this.verifyProjectAccess(tracking.projectId, userId);

    return tracking;
  }

  async updateBudgetTracking(
    id: string,
    updateDto: UpdateBudgetTrackingDto,
    userId: string,
  ) {
    const existing = await this.prisma.budgetTracking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Budget tracking record not found');
    }

    await this.verifyProjectAccess(existing.projectId, userId);

    return this.prisma.budgetTracking.update({
      where: { id },
      data: {
        ...(updateDto.budgetedAmount && {
          budgetedAmount: new Prisma.Decimal(updateDto.budgetedAmount),
        }),
        ...(updateDto.actualSpent && {
          actualSpent: new Prisma.Decimal(updateDto.actualSpent),
        }),
        ...(updateDto.committedAmount && {
          committedAmount: new Prisma.Decimal(updateDto.committedAmount),
        }),
        lastUpdated: new Date(),
        variance: new Prisma.Decimal(
          Number(updateDto.budgetedAmount ?? existing.budgetedAmount) -
            Number(updateDto.actualSpent ?? existing.actualSpent),
        ),
      },
    });
  }

  async deleteBudgetTracking(id: string, userId: string) {
    const existing = await this.prisma.budgetTracking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Budget tracking record not found');
    }

    await this.verifyProjectAccess(existing.projectId, userId);

    return this.prisma.budgetTracking.delete({
      where: { id },
    });
  }

  async getBudgetSummary(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const [project, budgets, expenses, trackings] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          budget: true,
          actualCost: true,
        },
      }),
      this.prisma.budget.aggregate({
        where: { projectId },
        _sum: {
          totalBudget: true,
        },
      }),
      this.prisma.expense.aggregate({
        where: { projectId },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.budgetTracking.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      totalBudget: budgets._sum.totalBudget || 0,
      totalExpenses: expenses._sum.amount || 0,
      projectBudget: project?.budget || 0,
      projectActualCost: project?.actualCost || 0,
      historicalData: trackings.map((t) => ({
        date: t.createdAt,
        budgeted: t.budgetedAmount,
        actual: t.actualSpent,
        variance: t.variance,
      })),
    };
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.members.length === 0) {
      throw new BadRequestException(
        'User does not have access to this project',
      );
    }
  }
}
