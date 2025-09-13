
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { CreateBudgetCategoryDto } from '../dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from '../dto/update-budget-category.dto';
import { BudgetQueryDto } from '../dto/budget-query.dto';
import { BudgetItemType, Prisma } from '@prisma/client';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}


   async createBudget(createBudgetDto: CreateBudgetDto, createdBy: string) {
    const { categories, ...budgetData } = createBudgetDto;
    const totalCategoriesAmount = categories.reduce(
      (sum, cat) => sum + cat.estimatedAmount,
      0,
    );

    if (totalCategoriesAmount > budgetData.totalBudget) {
      throw new BadRequestException(
        'La somme des catégories dépasse le budget total',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: budgetData.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${budgetData.projectId} not found`);
    }

    try {

        const budgetCreateData: Prisma.BudgetCreateInput = {
        name: budgetData.name,
        description: budgetData.description,
        type: 'FIXED', 
        status: 'DRAFT',
        totalBudget: budgetData.totalBudget,
        allocatedAmount: totalCategoriesAmount,
        spentAmount: 0,
        remainingAmount: budgetData.totalBudget - totalCategoriesAmount,
        contingencyAmount: 0,
        startDate: new Date(budgetData.startDate),
        endDate: budgetData.endDate ? new Date(budgetData.endDate) : null,
        project: {
          connect: {
            id: budgetData.projectId,
          },
        },
        creator: {
          connect: {
            id: createdBy,
          },
        },
        items: {
          create: categories.map((cat, index) => ({
            name: cat.name,
            description: cat.description || `${cat.name} category item`,
            type: this.mapCategoryToItemType(cat.type),
            estimatedAmount: cat.estimatedAmount,
            actualAmount: 0,
            sortOrder: index + 1,
          })),
        },
      };

      const budget = await this.prisma.budget.create({
        data: budgetCreateData,
        include: {
          items: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Budget created successfully',
        data: budget,
      };

    } catch (error) {
      console.error('Error creating budget:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throw new BadRequestException('Budget with this information already exists');
          case 'P2003':
            throw new BadRequestException('Referenced project does not exist');
          default:
            throw new BadRequestException(`Database error: ${error.message}`);
        }
      }

      throw new BadRequestException('Failed to create budget');
    }
  }

  
  private mapCategoryToItemType(category: string): BudgetItemType {
    const categoryToTypeMap: Record<string, BudgetItemType> = {
      'MATERIAL': BudgetItemType.MATERIAL || 'MATERIAL',
      'LABOR': BudgetItemType.LABOR || 'LABOR', 
      'EQUIPMENT': BudgetItemType.EQUIPMENT || 'EQUIPMENT',
      'SUBCONTRACTOR': BudgetItemType.SUBCONTRACTOR || 'SUBCONTRACTOR',
      'PERMIT': BudgetItemType.PERMIT || 'PERMIT',
      'DESIGN': BudgetItemType.DESIGN || 'DESIGN',
      'CONTINGENCY': BudgetItemType.CONTINGENCY || 'CONTINGENCY',
      'OTHER': BudgetItemType.OTHER || 'OTHER',
    };

    return categoryToTypeMap[category] || BudgetItemType.OTHER || 'OTHER';
  }

  async getProjectBudgets(projectId: string, query?: BudgetQueryDto) {
    const { page = 1, limit = 10 } = query || {};

    const where = {
      projectId,
      ...(query?.startDate && {
        startDate: { gte: new Date(query.startDate) },
      }),
      ...(query?.endDate && {
        endDate: { lte: new Date(query.endDate) },
      }),
    };

    const [budgets, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        include: {
          items: {
            include: {
              _count: {
                select: {
                  expenses: true,
                 
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.budget.count({ where }),
    ]);

    return {
      data: budgets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async getBudgetById(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        items: {
          include: {
            expenses: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                creator: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget non trouvé');
    }

    return budget;
  }

  async updateBudget(budgetId: string, updateData: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        items: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget non trouvé');
    }

    if (updateData.totalBudget) {
      const totalCategoriesAmount = budget.items.reduce(
        (sum, item) => sum + Number(item.estimatedAmount),
        0,
      );

      if (totalCategoriesAmount > updateData.totalBudget) {
        throw new BadRequestException(
          'La somme des catégories dépasse le nouveau budget total',
        );
      }
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...updateData,
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
      },
      include: {
        items: true,
      },
    });
  }

 
  async deleteBudget(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget non trouvé');
    }

    return this.prisma.budget.delete({
      where: { id: budgetId },
    });
  }


async addBudgetCategory(
  budgetId: string,
  createCategoryDto: CreateBudgetCategoryDto,
) {
  const budget = await this.prisma.budget.findUnique({
    where: { id: budgetId },
    include: { items: true },
  });

  if (!budget) {
    throw new NotFoundException('Budget non trouvé');
  }

  const totalItemsAmount = budget.items.reduce(
    (sum, item) => sum + Number(item.estimatedAmount),
    0,
  );

  if (
    totalItemsAmount + createCategoryDto.estimatedAmount >
    Number(budget.totalBudget)
  ) {
    throw new BadRequestException(
      "L'ajout de cette catégorie dépasse le budget total",
    );
  }

  const maxSortOrder = budget.items.length > 0 
    ? Math.max(...budget.items.map(item => item.sortOrder))
    : 0;

  return this.prisma.budgetItem.create({
    data:{ 
      budgetId,
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      type: createCategoryDto.type, 
      estimatedAmount: createCategoryDto.estimatedAmount, 
      sortOrder: maxSortOrder + 1,
    }
  });
}

 

  async updateBudgetCategory(
    categoryId: string,
    updateCategoryDto: UpdateBudgetCategoryDto,
  ) {
    const category = await this.prisma.budgetItem.findUnique({
      where: { id: categoryId },
      include: {
        budget: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    if (updateCategoryDto.allocatedAmount) {
      const otherCategoriesAmount = category.budget.items
        .filter((item) => item.id !== categoryId)
        .reduce((sum, item) => sum + Number(item.estimatedAmount), 0);

      if (
        otherCategoriesAmount + updateCategoryDto.allocatedAmount >
        Number(category.budget.totalBudget)
      ) {
        throw new BadRequestException(
          'Le nouveau montant dépasse le budget total',
        );
      }
    }

    return this.prisma.budgetItem.update({
      where: { id: categoryId },
      data: updateCategoryDto,
    });
  }

 
  async deleteBudgetCategory(categoryId: string) {
    const category = await this.prisma.budgetItem.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    return this.prisma.budgetItem.delete({
      where: { id: categoryId },
    });
  }


  async getBudgetSummary(projectId: string) {
    const [budgets, expenses, allocations] = await Promise.all([
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
      this.prisma.budgetAllocation.aggregate({
        where: {
            budget: {
              projectId,
            },
          },
        _sum: {
          spentAmount: true,
          allocatedAmount: true,
        },
      }),
    ]);

    return {
      totalBudget: Number(budgets._sum.totalBudget || 0),
  totalExpenses: Number(expenses._sum.amount || 0),
  totalAllocated: Number(allocations._sum.allocatedAmount || 0), 
  remainingBudget:
    Number(budgets._sum.totalBudget || 0) -
    Number(expenses._sum.amount || 0),
    };
  }
}