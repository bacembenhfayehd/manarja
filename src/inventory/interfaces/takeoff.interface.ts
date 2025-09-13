import { TakeoffStatus } from '../enums';

export interface ITakeoff {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  area?: string;
  trade?: string;
  status: TakeoffStatus;
  totalEstimatedCost: number;
  totalItems: number;
  version: number;
  isTemplate: boolean;
  templateId?: string;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ITakeoffItem {
  id: string;
  takeoffId: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  category?: string;
  phase?: string;
  location?: string;
  laborHours?: number;
  wasteFactor?: number;
  markup?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITakeoffSummary {
  takeoffId: string;
  totalCost: number;
  totalItems: number;
  categoryBreakdown: Array<{
    category: string;
    itemCount: number;
    totalCost: number;
    percentage: number;
  }>;
  vendorBreakdown: Array<{
    vendorId: string;
    vendorName: string;
    itemCount: number;
    totalCost: number;
    percentage: number;
  }>;
  phaseBreakdown?: Array<{
    phase: string;
    itemCount: number;
    totalCost: number;
    percentage: number;
  }>;
}