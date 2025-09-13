export class PipelineStatsDto {
  totalOpportunities: number;
  totalValue: number;
  averageDealSize: number;
  conversionRate: number;
  stageBreakdown: StageStatsDto[];
}

export class StageStatsDto {
  stage: string;
  count: number;
  totalValue: number;
  averageValue: number;
}