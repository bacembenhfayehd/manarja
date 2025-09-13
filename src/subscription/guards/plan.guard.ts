
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../subscription.service';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<string>(
      REQUIRES_PLAN_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPlan) {
      return true; // no plan required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const subscription = await this.subscriptionService.getCurrentSubscription(user.id);
      
      if (subscription.plan.name !== requiredPlan) {
        throw new ForbiddenException(`Plan '${requiredPlan}' required`);
      }

      return true;
    } catch (error) {
      throw new ForbiddenException('Valid subscription required');
    }
  }
}