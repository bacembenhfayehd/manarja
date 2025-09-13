import { CompanyBranding } from '@prisma/client';

export interface BrandingWithPresignedUrls extends CompanyBranding {
  logoPresignedUrl?: string;
  faviconPresignedUrl?: string;
}

export interface FileUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export interface BrandingUpdatePayload {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}