import { Injectable } from '@nestjs/common';
import { WebhookEventInterface, WebhookProcessorInterface } from '../../interfaces/webhook-event.interface';
import { PaymentProvider } from '../../enums/payment-provider.enum';
import { PaypalService } from './paypal.service';
import { SubscriptionStatus } from '../../enums/subscription-status.enum';

@Injectable()
export class PaypalWebhookService implements WebhookProcessorInterface {
  constructor(private readonly paypalService: PaypalService) {}

  canProcess(eventType: string): boolean {
    const supportedEvents = [
      'PAYMENT.CAPTURE.COMPLETED',
      'PAYMENT.CAPTURE.DENIED',
      'PAYMENT.CAPTURE.PENDING',
      'PAYMENT.CAPTURE.REFUNDED',
      'BILLING.SUBSCRIPTION.ACTIVATED',
      'BILLING.SUBSCRIPTION.CANCELLED',
      'BILLING.SUBSCRIPTION.EXPIRED',
      'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
      'BILLING.SUBSCRIPTION.SUSPENDED',
      'BILLING.SUBSCRIPTION.UPDATED',
    ];

    return supportedEvents.includes(eventType);
  }

  async process(event: WebhookEventInterface): Promise<void> {
    if (!this.canProcess(event.eventType)) {
      return;
    }

    try {
      switch (event.eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(event.data);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePaymentRefunded(event.data);
          break;
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(event.data);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(event.data);
          break;
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          await this.handleSubscriptionPaymentFailed(event.data);
          break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await this.handleSubscriptionSuspended(event.data);
          break;
        case 'BILLING.SUBSCRIPTION.UPDATED':
          await this.handleSubscriptionUpdated(event.data);
          break;
        default:
          console.warn(`Unhandled PayPal webhook event: ${event.eventType}`);
      }

      event.processed = true;
      event.processedAt = new Date();
    } catch (error) {
      event.errorMessage = error.message;
      event.retryCount += 1;
      throw error;
    }
  }

  private async handlePaymentCompleted(data: any): Promise<void> {
    // Implement logic to update your database when a payment is completed
    console.log('Payment completed:', data.id);
    // Update your database with payment status
  }

  private async handlePaymentRefunded(data: any): Promise<void> {
    // Implement logic to handle refunds
    console.log('Payment refunded:', data.id);
    // Update your database with refund status
  }

  private async handleSubscriptionActivated(data: any): Promise<void> {
    // Implement logic when subscription is activated
    console.log('Subscription activated:', data.id);
    // Update your database with subscription status
  }

  private async handleSubscriptionCancelled(data: any): Promise<void> {
    // Implement logic when subscription is cancelled
    console.log('Subscription cancelled:', data.id);
    // Update your database with subscription status
  }

  private async handleSubscriptionPaymentFailed(data: any): Promise<void> {
    // Implement logic when subscription payment fails
    console.log('Subscription payment failed:', data.id);
    // Update your database with subscription status
  }

  private async handleSubscriptionSuspended(data: any): Promise<void> {
    // Implement logic when subscription is suspended
    console.log('Subscription suspended:', data.id);
    // Update your database with subscription status
  }

  private async handleSubscriptionUpdated(data: any): Promise<void> {
    // Implement logic when subscription is updated
    console.log('Subscription updated:', data.id);
    // Update your database with subscription changes
  }

  mapPaypalStatusToLocalStatus(paypalStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      ACTIVE: SubscriptionStatus.ACTIVE,
      APPROVAL_PENDING: SubscriptionStatus.PENDING,
      APPROVED: SubscriptionStatus.ACTIVE,
      SUSPENDED: SubscriptionStatus.PAUSED,
      CANCELLED: SubscriptionStatus.CANCELED,
      EXPIRED: SubscriptionStatus.CANCELED,
    };

    return statusMap[paypalStatus] || SubscriptionStatus.UNPAID;
  }
}