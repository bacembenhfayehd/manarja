import { RequisitionStatus, Priority } from '../enums';

export interface IPurchaseRequisition {
  id: string;
  requisitionNumber: string;
  vendorId: string;
  takeoffId?: string;
  projectId?: string;
  status: RequisitionStatus;
  priority: Priority;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  finalAmount?: number;
  notes?: string;
  internalNotes?: string;
  requiredDate?: Date;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  orderedBy?: string;
  orderedAt?: Date;
  orderNumber?: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRequisitionItem {
  id: string;
  requisitionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  receivedQuantity?: number;
  remainingQuantity?: number;
  isReceived: boolean;
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRequisitionWorkflow {
  requisitionId: string;
  currentStatus: RequisitionStatus;
  nextPossibleStatuses: RequisitionStatus[];
  requiredApprovals: Array<{
    level: number;
    role: string;
    userId?: string;
    approved: boolean;
    approvedAt?: Date;
    comments?: string;
  }>;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
}
