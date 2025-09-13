import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunityFilterDto } from './dto/opportunity-filter.dto';
import { OpportunityStage } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createOpportunityDto: CreateOpportunityDto) {
    // Verify contact exists
    const contact = await this.prisma.contact.findUnique({
      where: { id: createOpportunityDto.contactId }
    });

    if (!contact) {
      throw new BadRequestException('Contact not found');
    }

    return this.prisma.opportunity.create({
      data: {
        ...createOpportunityDto,
        expectedCloseDate: new Date(createOpportunityDto.expectedCloseDate)
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
  }

  async findAll(filters: OpportunityFilterDto) {
    const { search, stage, contactId, assignedTo, startDate, endDate, minValue, maxValue, page, limit, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { dealName: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { contact: { company: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (stage) where.stage = stage;
    if (contactId) where.contactId = contactId;
    if (assignedTo) where.assignedTo = assignedTo;

    if (startDate || endDate) {
      where.expectedCloseDate = {};
      if (startDate) where.expectedCloseDate.gte = new Date(startDate);
      if (endDate) where.expectedCloseDate.lte = new Date(endDate);
    }

    if (minValue || maxValue) {
      where.estimatedValue = {};
      if (minValue) where.estimatedValue.gte = minValue;
      if (maxValue) where.estimatedValue.lte = maxValue;
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: {
                select: { id: true, name: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      this.prisma.opportunity.count({ where })
    ]);

    return {
      data: opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getStats(filters: OpportunityFilterDto) {
    const where = this.buildWhereClause(filters);

    const opportunities = await this.prisma.opportunity.findMany({ where });

    const totalValue = opportunities.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0);
    const avgValue = opportunities.length > 0 ? totalValue / opportunities.length : 0;
    const closedWon = opportunities.filter(opp => opp.stage === 'CLOSED_WON').length;
    const winRate = opportunities.length > 0 ? (closedWon / opportunities.length) * 100 : 0;

    return {
      totalOpportunities: opportunities.length,
      totalValue,
      averageValue: avgValue,
      winRate,
      byStage: this.groupByStage(opportunities)
    };
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return opportunity;
  }

  async update(id: string, updateOpportunityDto: UpdateOpportunityDto) {
    try {
      const data: any = { ...updateOpportunityDto };
      if (updateOpportunityDto.expectedCloseDate) {
        data.expectedCloseDate = new Date(updateOpportunityDto.expectedCloseDate);
      }

      return await this.prisma.opportunity.update({
        where: { id },
        data,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  async updateStage(id: string, stage: string) {
    if (!Object.values(OpportunityStage).includes(stage as OpportunityStage)) {
      throw new BadRequestException('Invalid stage');
    }

    try {
      return await this.prisma.opportunity.update({
        where: { id },
        data: { stage: stage as OpportunityStage },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
    } catch (error) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.opportunity.delete({
        where: { id }
      });
    } catch (error) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  private buildWhereClause(filters: OpportunityFilterDto) {
    const where: any = {};
    
    if (filters.stage) where.stage = filters.stage;
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    
    if (filters.startDate || filters.endDate) {
      where.expectedCloseDate = {};
      if (filters.startDate) where.expectedCloseDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.expectedCloseDate.lte = new Date(filters.endDate);
    }
    
    return where;
  }

  private groupByStage(opportunities: any[]) {
    return opportunities.reduce((acc, opp) => {
      const stage = opp.stage;
      if (!acc[stage]) {
        acc[stage] = { count: 0, totalValue: 0 };
      }
      acc[stage].count++;
      acc[stage].totalValue += Number(opp.estimatedValue);
      return acc;
    }, {});
  }
}