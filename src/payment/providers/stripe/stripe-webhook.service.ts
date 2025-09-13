import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../../services/payment.service';
import { SubscriptionService } from '../../services/subscription.service';
import { RefundService } from '../../services/refund.service';
import { PaymentStatus } from '../../enums/payment-status.enum';
import { SubscriptionStatus } from '../../enums/subscription-status.enum';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private subscriptionService: SubscriptionService,
    private refundService: RefundService,
  ) {}

  async processPaymentIntentSucceeded(paymentIntent: any) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: paymentIntent.id },
      });

      if (payment) {
        await this.paymentService.updatePaymentStatus(
          payment.id,
          PaymentStatus.SUCCEEDED,
          paymentIntent
        );
        this.logger.log(`Payment ${payment.id} marked as succeeded`);
      }
    } catch (error) {
      this.logger.error('Error processing payment_intent.succeeded:', error);
    }
  }

  async processPaymentIntentFailed(paymentIntent: any) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { providerPaymentId: paymentIntent.id },
      });

      if (payment) {
        await this.paymentService.updatePaymentStatus(
          payment.id,
          PaymentStatus.FAILED,
          paymentIntent
        );
        this.logger.log(`Payment ${payment.id} marked as failed`);
      }
    } catch (error) {
      this.logger.error('Error processing payment_intent.payment_failed:', error);
    }
  }

  async processSubscriptionUpdated(subscription: any) {
    try {
      const dbSubscription = await this.prisma.subscription.findFirst({
        where: { providerSubscriptionId: subscription.id },
      });

      if (dbSubscription) {
        const status = this.mapStripeSubscriptionStatus(subscription.status);
        
        await this.prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          },
        });

        this.logger.log(`Subscription ${dbSubscription.id} updated`);
      }
    } catch (error) {
      this.logger.error('Error processing customer.subscription.updated:', error);
    }
  }

  async processSubscriptionDeleted(subscription: any) {
    try {
      const dbSubscription = await this.prisma.subscription.findFirst({
        where: { providerSubscriptionId: subscription.id },
      });

      if (dbSubscription) {
        await this.prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            status: SubscriptionStatus.CANCELED,
            canceledAt: new Date(),
          },
        });

        this.logger.log(`Subscription ${dbSubscription.id} canceled`);
      }
    } catch (error) {
      this.logger.error('Error processing customer.subscription.deleted:', error);
    }
  }

  async processChargeDisputeCreated(dispute: any) {
    try {
      // Logique de traitement des litiges
      this.logger.log(`Dispute created for charge: ${dispute.charge}`);
    } catch (error) {
      this.logger.error('Error processing charge.dispute.created:', error);
    }
  }

  private mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'paused':
        return SubscriptionStatus.PAUSED;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
}
