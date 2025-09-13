import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '../../enums/payment-provider.enum';
import { PaymentProviderInterface } from '../../interfaces/payment-provider.interface';
import {
  CreatePaymentRequest,
  PaymentResponse,
  CreateSubscriptionRequest,
  SubscriptionResponse,
  UpdateSubscriptionRequest,
  RefundResponse,
} from '../../interfaces/payment-provider.interface';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalService implements PaymentProviderInterface {
  private readonly client: paypal.core.PayPalHttpClient;
  public readonly provider = PaymentProvider.PAYPAL;

  constructor(private readonly configService: ConfigService) {
    const environment = this.configService.get<string>('PAYPAL_ENVIRONMENT');
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    let paypalEnv: paypal.core.SandboxEnvironment | paypal.core.LiveEnvironment;
    
    if (environment === 'production') {
      paypalEnv = new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
      paypalEnv = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }

    this.client = new paypal.core.PayPalHttpClient(paypalEnv);
  }

  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: data.currency,
            value: data.amount.toString(),
          },
          description: data.description,
        },
      ],
      application_context: {
        return_url: this.configService.get<string>('PAYPAL_RETURN_URL'),
        cancel_url: this.configService.get<string>('PAYPAL_CANCEL_URL'),
      },
    });

    try {
      const response = await this.client.execute(request);
      const order = response.result;

      return {
        id: order.id,
        status: order.status,
        amount: data.amount,
        currency: data.currency,
        paymentUrl: order.links.find(link => link.rel === 'approve').href,
      };
    } catch (error) {
      throw new Error(`PayPal payment creation failed: ${error.message}`);
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentResponse> {
    const request = new paypal.orders.OrdersCaptureRequest(paymentId);
    request.requestBody({});

    try {
      const response = await this.client.execute(request);
      const capture = response.result;

      return {
        id: capture.id,
        status: capture.status,
        amount: parseFloat(capture.purchase_units[0].amount.value),
        currency: capture.purchase_units[0].amount.currency_code,
      };
    } catch (error) {
      throw new Error(`PayPal payment capture failed: ${error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    // PayPal doesn't have a direct cancel for orders, we just return the current status
    const request = new paypal.orders.OrdersGetRequest(paymentId);

    try {
      const response = await this.client.execute(request);
      const order = response.result;

      return {
        id: order.id,
        status: order.status,
        amount: parseFloat(order.purchase_units[0].amount.value),
        currency: order.purchase_units[0].amount.currency_code,
      };
    } catch (error) {
      throw new Error(`PayPal payment cancel failed: ${error.message}`);
    }
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const request = new paypal.billing.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: data.planId,
      start_time: new Date(Date.now() + 1000 * 60).toISOString(), // Start 1 minute from now
      subscriber: {
        email_address: data.customerId, // Using customerId as email for simplicity
      },
      application_context: {
        return_url: this.configService.get<string>('PAYPAL_RETURN_URL'),
        cancel_url: this.configService.get<string>('PAYPAL_CANCEL_URL'),
      },
    });

    try {
      const response = await this.client.execute(request);
      const subscription = response.result;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.create_time),
        currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
        cancelAtPeriodEnd: false,
      };
    } catch (error) {
      throw new Error(`PayPal subscription creation failed: ${error.message}`);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    data: UpdateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    // PayPal requires a plan with the same billing frequency to update
    const request = new paypal.billing.SubscriptionsReviseRequest(subscriptionId);
    request.requestBody({
      plan_id: data.planId,
    });

    try {
      const response = await this.client.execute(request);
      const subscription = response.result;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.create_time),
        currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
        cancelAtPeriodEnd: false,
      };
    } catch (error) {
      throw new Error(`PayPal subscription update failed: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const request = new paypal.billing.SubscriptionsCancelRequest(subscriptionId);
    request.requestBody({
      reason: 'Cancelled by user',
    });

    try {
      await this.client.execute(request);

      // Get subscription details after cancellation
      const getRequest = new paypal.billing.SubscriptionsGetRequest(subscriptionId);
      const response = await this.client.execute(getRequest);
      const subscription = response.result;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.create_time),
        currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
        cancelAtPeriodEnd: true,
      };
    } catch (error) {
      throw new Error(`PayPal subscription cancellation failed: ${error.message}`);
    }
  }

  async createRefund(paymentId: string, amount?: number): Promise<RefundResponse> {
    const request = new paypal.payments.CapturesRefundRequest(paymentId);
    request.requestBody({
      amount: amount
        ? {
            value: amount.toString(),
            currency_code: 'USD', // Assuming USD for simplicity
          }
        : undefined,
    });

    try {
      const response = await this.client.execute(request);
      const refund = response.result;

      return {
        id: refund.id,
        status: refund.status,
        amount: parseFloat(refund.amount.value),
        currency: refund.amount.currency_code,
      };
    } catch (error) {
      throw new Error(`PayPal refund creation failed: ${error.message}`);
    }
  }

  validateWebhook(payload: string, signature: string): boolean {
    // PayPal webhook validation implementation
    // In a real implementation, you would verify the webhook signature
    // with PayPal's API
    return true; // Simplified for example
  }

  async processWebhook(eventType: string, data: any): Promise<void> {
    // This is a placeholder - actual implementation would handle specific events
    console.log(`Processing PayPal webhook event: ${eventType}`);
  }
}