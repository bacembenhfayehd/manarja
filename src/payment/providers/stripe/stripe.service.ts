import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider } from '../../enums/payment-provider.enum';
import { PaymentProviderError } from '../../exceptions/payment.exception';
import {
  PaymentProviderInterface,
  CreatePaymentRequest,
  PaymentResponse,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionResponse,
  RefundResponse,
} from '../../interfaces/payment-provider.interface';

@Injectable()
export class StripeService implements PaymentProviderInterface {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  public readonly provider = PaymentProvider.STRIPE;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2023-10-16',
      }
    );
  }

  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convertir en centimes
        currency: data.currency,
        description: data.description,
        customer: data.customerId,
        metadata: data.metadata,
        automatic_payment_methods: { enabled: true },
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: data.amount,
        currency: data.currency,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error('Stripe payment creation failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error('Stripe payment capture failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error('Stripe payment cancellation failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: data.planId }],
        metadata: data.metadata,
      };

      if (data.trialDays) {
        subscriptionData.trial_period_days = data.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      this.logger.error('Stripe subscription creation failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async updateSubscription(subscriptionId: string, data: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {
        metadata: data.metadata,
      };

      if (data.planId) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateData.items = [{
          id: subscription.items.data[0].id,
          price: data.planId,
        }];
      }

      if (data.quantity) {
        updateData.quantity = data.quantity;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      this.logger.error('Stripe subscription update failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      this.logger.error('Stripe subscription cancellation failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  async createRefund(paymentId: string, amount?: number): Promise<RefundResponse> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency,
      };
    } catch (error) {
      this.logger.error('Stripe refund creation failed:', error);
      throw new PaymentProviderError('Stripe', error.message);
    }
  }

  validateWebhook(payload: string, signature: string): boolean {
    try {
      const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return true;
    } catch (error) {
      this.logger.error('Stripe webhook validation failed:', error);
      return false;
    }
  }

  async processWebhook(eventType: string, data: any): Promise<void> {
    this.logger.log(`Processing Stripe webhook: ${eventType}`);
    
    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(data);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(data);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(data);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(data);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(data);
        break;
      default:
        this.logger.log(`Unhandled Stripe event: ${eventType}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Logique de traitement du paiement réussi
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Logique de traitement du paiement échoué
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Logique de traitement du paiement de facture réussi
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Logique de traitement de la mise à jour d'abonnement
    this.logger.log(`Subscription updated: ${subscription.id}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Logique de traitement de la suppression d'abonnement
    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }
}