import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { SubscriptionNotFoundError, PaymentException } from '../exceptions/payment.exception';
import { StripeService } from '../providers/stripe/stripe.service';
import { PaypalService } from '../providers/paypal/paypal.service';
import { PaymentProviderInterface } from '../interfaces/payment-provider.interface';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private paypalService: PaypalService,
  ) {}

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    try {
      const provider = this.getPaymentProvider(createSubscriptionDto.provider);
      
      // Vérifier que le plan existe
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: createSubscriptionDto.planId },
      });

      if (!plan) {
        throw new PaymentException('Subscription plan not found');
      }

      // Vérifier que l'utilisateur existe
      const user = await this.prisma.user.findUnique({
        where: { id: createSubscriptionDto.userId },
      });

      if (!user) {
        throw new PaymentException('User not found');
      }

      // Créer l'abonnement dans la base de données
      const now = new Date();
      const trialEnd = createSubscriptionDto.trialDays 
        ? new Date(now.getTime() + createSubscriptionDto.trialDays * 24 * 60 * 60 * 1000)
        : null;

      const subscription = await this.prisma.subscription.create({
        data: {
          userId: createSubscriptionDto.userId,
          planId: createSubscriptionDto.planId,
          provider: createSubscriptionDto.provider,
          status: trialEnd ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: this.calculatePeriodEnd(now, plan.interval, plan.intervalCount),
          trialEnd,
          unitAmount: plan.price,
          currency: createSubscriptionDto.currency,
          metadata: createSubscriptionDto.metadata,
        },
        include: {
          user: true,
          plan: true,
        },
      });

      // Créer l'abonnement chez le fournisseur
      const providerResponse = await provider.createSubscription({
        customerId: user.stripeCustomerId || user.paypalCustomerId,
        planId: this.getProviderPlanId(plan, createSubscriptionDto.provider),
        trialDays: createSubscriptionDto.trialDays,
        metadata: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          ...createSubscriptionDto.metadata,
        },
      });

      // Mettre à jour avec les informations du fournisseur
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          providerSubscriptionId: providerResponse.id,
          currentPeriodStart: providerResponse.currentPeriodStart,
          currentPeriodEnd: providerResponse.currentPeriodEnd,
          trialEnd: providerResponse.trialEnd,
        },
        include: {
          user: true,
          plan: true,
        },
      });

      return updatedSubscription;
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw new PaymentException('Failed to create subscription');
    }
  }

  async getSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true,
        payments: true,
        invoices: true,
      },
    });

    if (!subscription) {
      throw new SubscriptionNotFoundError(id);
    }

    return subscription;
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.getSubscription(id);
    const provider = this.getPaymentProvider(subscription.provider);

    try {
      // Mettre à jour chez le fournisseur si nécessaire
      if (updateSubscriptionDto.planId) {
        const newPlan = await this.prisma.subscriptionPlan.findUnique({
          where: { id: updateSubscriptionDto.planId },
        });

        if (!newPlan) {
          throw new PaymentException('New subscription plan not found');
        }

        await provider.updateSubscription(subscription.providerSubscriptionId, {
          planId: this.getProviderPlanId(newPlan, subscription.provider),
        });
      }

      // Mettre à jour dans la base de données
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id },
        data: {
          ...updateSubscriptionDto,
          updatedAt: new Date(),
        },
        include: {
          user: true,
          plan: true,
        },
      });

      return updatedSubscription;
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      throw new PaymentException('Failed to update subscription');
    }
  }

  async cancelSubscription(id: string, cancelAtPeriodEnd = true) {
    const subscription = await this.getSubscription(id);
    const provider = this.getPaymentProvider(subscription.provider);

    try {
      await provider.cancelSubscription(subscription.providerSubscriptionId);

      const updatedSubscription = await this.prisma.subscription.update({
        where: { id },
        data: {
          status: cancelAtPeriodEnd ? subscription.status : SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd,
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: true,
          plan: true,
        },
      });

      return updatedSubscription;
    } catch (error) {
      this.logger.error('Error canceling subscription:', error);
      throw new PaymentException('Failed to cancel subscription');
    }
  }

  private getPaymentProvider(provider: PaymentProvider): PaymentProviderInterface {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return this.stripeService;
      case PaymentProvider.PAYPAL:
        return this.paypalService;
      default:
        throw new PaymentException(`Unsupported payment provider: ${provider}`);
    }
  }

  private calculatePeriodEnd(start: Date, interval: string, intervalCount: number): Date {
    const end = new Date(start);
    
    switch (interval) {
      case 'month':
        end.setMonth(end.getMonth() + intervalCount);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + intervalCount);
        break;
      default:
        throw new PaymentException(`Unsupported interval: ${interval}`);
    }
    
    return end;
  }

  private getProviderPlanId(plan: any, provider: PaymentProvider): string {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return plan.stripePriceId;
      case PaymentProvider.PAYPAL:
        return plan.paypalPlanId;
      default:
        throw new PaymentException(`Unsupported payment provider: ${provider}`);
    }
  }
}
