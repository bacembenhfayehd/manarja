// subscription.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  async getActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
   
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { 
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] }
      }
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

   
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId }
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

   
    const now = new Date();
    const trialEnd = plan.trialDays ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null;
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: dto.planId,
        status: plan.trialDays ? 'TRIALING' : 'ACTIVE',
        provider: dto.provider,
        currentPeriodStart: now,
        currentPeriodEnd,
        trialEnd,
        unitAmount: plan.price,
        currency: plan.currency,
      },
      include: {
        plan: true
      }
    });
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: dto,
      include: {
        plan: true
      }
    });
  }

  async cancelSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    });
  }

  async getSubscriptionUsage(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        user: {
          include: {
            _count: {
              select: { 
              timeEntries: true,
              projectMembers: true, // Projets où l'user est membre
              subscriptions: true,
              payments: true,
              invoices: true,
            }
            }
          }
        }
      }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      planLimits: {
        maxProjects: subscription.plan.maxProjects,
        maxLeads: subscription.plan.maxLeads,
      },
      currentUsage: {
        projects: subscription.user._count.projectMembers,
        timeEntries: subscription.user._count.timeEntries,
        payments: subscription.user._count.payments,
        invoices: subscription.user._count.invoices,
        
      }
    };
  }

  
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { gt: new Date() }
      }
    });

    return !!subscription;
  }

  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      include: {
        plan: true
      }
    });

    if (!subscription) return false;

    const features = subscription.plan.features as string[];
    return features?.includes(feature) || false;
  }

  async checkProjectLimit(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    const userProjectCount = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { projectMembers: true }
        }
      }
    });

    if (!subscription.plan.maxProjects) return true; // Unlimited
    return userProjectCount._count.projectMembers < subscription.plan.maxProjects;
  }
}