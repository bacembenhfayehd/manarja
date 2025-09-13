import { TransactionType, ValuationMethod } from '../enums';

export interface IInventoryTransaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference?: string;
  notes?: string;
  requisitionId?: string;
  orderId?: string;
  invoiceId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  location?: string;
  transactionDate: Date;
  createdAt: Date;
  createdBy: string;
}

export interface IInventoryBalance {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  totalValue: number;
  lastTransactionDate?: Date;
  lastUpdated: Date;
  location?: string;
  batchBalances?: Array<{
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiryDate?: Date;
  }>;
}

export interface IInventoryValuation {
  totalValue: number;
  totalQuantity: number;
  productCount: number;
  method: ValuationMethod;
  calculatedAt: Date;
  categoryBreakdown: Array<{
    category: string;
    productCount: number;
    totalQuantity: number;
    totalValue: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentQuantity: number;
    minStockLevel: number;
    reorderPoint: number;
  }>;
}

export interface IStockMovement {
  date: Date;
  productId: string;
  productName: string;
  transactionType: TransactionType;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitCost: number;
  totalValue: number;
  reference?: string;
  notes?: string;
}

export interface IInventoryReport {
  reportType: 'STOCK_LEVEL' | 'MOVEMENT' | 'VALUATION' | 'AGING' | 'ABC_ANALYSIS';
  generatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
  filters: Record<string, any>;
  data: any[];
  summary: {
    totalProducts: number;
    totalValue: number;
    totalQuantity: number;
    averageTurnover?: number;
    topCategories?: Array<{
      category: string;
      value: number;
      percentage: number;
    }>;
  };
}
