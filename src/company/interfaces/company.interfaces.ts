import { UserCompanyRole } from '@prisma/client';

export interface CompanyWithBranding {
  id: string;
  name: string;
  description?: string;
  website?: string;
  contactInfo?: Record<string, any>;
  businessDetails?: Record<string, any>;
  settings?: Record<string, any>;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customCss?: string;
    faviconUrl?: string;
  };
}

export interface PaginatedCompanies {
  data: CompanyWithBranding[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}