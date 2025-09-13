import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineFilterDto } from './dto/pipeline-filter.dto';
import { PipelineStatsDto, StageStatsDto } from './dto/pipeline-stats.dto';
import { StageConversionDto } from './dto/stage-conversion.dto';
import { OpportunityStage } from '@prisma/client';

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

  async getOverview(filters: PipelineFilterDto) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: this.buildWhereClause(filters),
      include: {
        contact: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return {
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0),
      opportunities: opportunities
    };
  }

  async getStats(filters: PipelineFilterDto): Promise<PipelineStatsDto> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: this.buildWhereClause(filters)
    });

    const totalValue = opportunities.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0);
    const totalOpportunities = opportunities.length;

    // Group by stage
    const stageGroups = opportunities.reduce((acc, opp) => {
      const stage = opp.stage;
      if (!acc[stage]) {
        acc[stage] = [];
      }
      acc[stage].push(opp);
      return acc;
    }, {} as Record<OpportunityStage, any[]>);

    const stageBreakdown: StageStatsDto[] = Object.entries(stageGroups).map(([stage, opps]) => ({
      stage,
      count: opps.length,
      totalValue: opps.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0),
      averageValue: opps.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0) / opps.length
    }));

    return {
      totalOpportunities,
      totalValue,
      averageDealSize: totalOpportunities > 0 ? totalValue / totalOpportunities : 0,
      conversionRate: this.calculateConversionRate(opportunities),
      stageBreakdown
    };
  }

  async getConversion(filters: PipelineFilterDto): Promise<StageConversionDto[]> {
    // Simplified conversion calculation
    const opportunities = await this.prisma.opportunity.findMany({
      where: this.buildWhereClause(filters)
    });

    const stages = Object.values(OpportunityStage);
    const conversions: StageConversionDto[] = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];
      
      const fromCount = opportunities.filter(opp => opp.stage === fromStage).length;
      const toCount = opportunities.filter(opp => opp.stage === toStage).length;
      
      conversions.push({
        fromStage,
        toStage,
        conversionRate: fromCount > 0 ? (toCount / fromCount) * 100 : 0,
        averageTimeInStage: 0, // À implémenter avec un historique des changements
        totalConverted: toCount
      });
    }

    return conversions;
  }

  private buildWhereClause(filters: PipelineFilterDto) {
    const where: any = {};

    if (filters.stage) {
      where.stage = filters.stage;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return where;
  }

  private calculateConversionRate(opportunities: any[]): number {
    const closedWon = opportunities.filter(opp => opp.stage === 'CLOSED_WON').length;
    const total = opportunities.length;
    return total > 0 ? (closedWon / total) * 100 : 0;
  }
}
