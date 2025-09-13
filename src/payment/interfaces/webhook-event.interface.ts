import { PaymentProvider } from '../enums/payment-provider.enum';

export interface WebhookEventInterface {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  providerEventId: string;
  data: any;
  processed: boolean;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export interface WebhookProcessorInterface {
  canProcess(eventType: string): boolean;
  process(event: WebhookEventInterface): Promise<void>;
}