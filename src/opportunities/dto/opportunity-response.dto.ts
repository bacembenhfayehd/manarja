import { OpportunityStage } from '@prisma/client';

export class OpportunityResponseDto {
  id: string;
  contactId: string;
  assignedTo?: string;
  dealName: string;
  estimatedValue: number;
  probabilityPercentage: number;
  expectedCloseDate: Date;
  stage: OpportunityStage;
  dealData?: any;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    company: {
      id: string;
      name: string;
    };
  };
}