import { BudgetCategory } from '../enums/budget-category.enum';

export interface IBudgetCategory {
  id: string;
  category: BudgetCategory;
  name: string;
  allocatedAmount: number;
  description?: string;
}

export interface IBudget {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  totalBudget: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  categories: IBudgetCategory[];
}