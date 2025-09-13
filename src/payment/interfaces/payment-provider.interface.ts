import { PaymentProvider } from '../enums/payment-provider.enum';

export interface PaymentProviderInterface {
  provider: PaymentProvider;
  
  // Paiements
  createPayment(data: CreatePaymentRequest): Promise<PaymentResponse>;
  capturePayment(paymentId: string): Promise<PaymentResponse>;
  cancelPayment(paymentId: string): Promise<PaymentResponse>;
  
  // Abonnements
  createSubscription(data: CreateSubscriptionRequest): Promise<SubscriptionResponse>;
  updateSubscription(subscriptionId: string, data: UpdateSubscriptionRequest): Promise<SubscriptionResponse>;
  cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
  
  // Remboursements
  createRefund(paymentId: string, amount?: number): Promise<RefundResponse>;
  
  // Webhooks
  validateWebhook(payload: string, signature: string): boolean;
  processWebhook(eventType: string, data: any): Promise<void>;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  clientSecret?: string;
  paymentUrl?: string;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  planId: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  quantity?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface RefundResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
}