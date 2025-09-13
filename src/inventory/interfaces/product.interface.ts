

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  unit: ProductUnit;
  standardCost?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  brand?: string;
  model?: string;
  specifications?: Record<string, any>;
  imageUrls?: string[];
  status: ProductStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IProductVendor {
  id: string;
  productId: string;
  vendorId: string;
  supplierSku: string;
  unitPrice: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  leadTimeDays: number;
  isPreferred: boolean;
  contractStartDate?: Date;
  contractEndDate?: Date;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductSearch {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  status?: ProductStatus;
  isActive?: boolean;
  vendorId?: string;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'sku' | 'category' | 'createdAt' | 'standardCost';
  sortOrder?: 'asc' | 'desc';
}
