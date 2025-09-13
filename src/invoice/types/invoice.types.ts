export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  FATOORA ='FATOORA',
  CASH = 'CASH',
  CHECK ='CHECK',
  ONLINE ='ONLINE'
}

export interface InvoiceHistory {
  id: string;
  invoiceId: string;
  action: string;
  details?: any;
  createdAt: Date;
  userId?: string;
}
