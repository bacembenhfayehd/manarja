import { BudgetCategory } from '../enums/budget-category.enum';
import { BudgetStatus } from '../enums/budget-status.enum';
import { AlertSeverity } from '../enums/alert-severity.enum';

export interface CategorySpending {
  category: BudgetCategory;
  categoryName: string;
  allocated: number;
  spent: number;
  committed: number;
  forecasted: number;
  remaining: number;
  variance: number;
  variancePercent: number;
  status: BudgetStatus;
}

export interface BudgetTrackingReport {
  budgetId: string;
  projectId: string;
  projectName: string;
  totalAllocated: number;
  totalSpent: number;
  totalCommitted: number;
  totalForecasted: number;
  totalRemaining: number;
  overallVariance: number;
  overallVariancePercent: number;
  categories: CategorySpending[];
  lastUpdated: Date;
}

export interface BudgetAlert {
  type: string;
  severity: AlertSeverity;
  message: string;
  category?: BudgetCategory;
  amount?: number;
}

export interface VarianceReport {
  summary: BudgetTrackingReport;
  expenses: any[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  generatedAt: Date;
}
