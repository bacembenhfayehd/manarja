import { VendorStatus } from '../enums';

export interface IVendor {
  id: string;
  name: string;
  code?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  contactTitle?: string;
  paymentTerms?: number;
  creditLimit?: number;
  taxId?: string;
  notes?: string;
  status: VendorStatus;
  isActive: boolean;
  rating?: number;
  lastOrderDate?: Date;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IVendorPerformance {
  vendorId: string;
  onTimeDeliveryRate: number;
  qualityRating: number;
  priceCompetitiveness: number;
  responseTime: number;
  totalOrders: number;
  totalValue: number;
  averageLeadTime: number;
  defectRate: number;
  period: {
    from: Date;
    to: Date;
  };
}

export interface IVendorSearch {
  query?: string;
  country?: string;
  city?: string;
  status?: VendorStatus;
  isActive?: boolean;
  hasProducts?: boolean;
  minRating?: number;
  paymentTermsMin?: number;
  paymentTermsMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'createdAt' | 'lastOrderDate';
  sortOrder?: 'asc' | 'desc';
}