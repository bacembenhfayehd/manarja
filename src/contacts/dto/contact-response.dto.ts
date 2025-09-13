import { ContactType, ContactStatus } from '@prisma/client';

export class ContactResponseDto {
  id: string;
  companyId: string;
  contactType: ContactType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  addresses?: any;
  status: ContactStatus;
  customFields?: any;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  company?: {
    id: string;
    name: string;
  };
  
  opportunities?: {
    id: string;
    dealName: string;
    estimatedValue: number;
    stage: string;
  }[];
}