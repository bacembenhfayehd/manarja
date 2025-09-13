// guards/subscription.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from '../subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(user.id);
    
    if (!hasActiveSubscription) {
      throw new ForbiddenException('Active subscription required');
    }

    // Optionnel: Attacher l'abonnement à la requête
    try {
      const subscription = await this.subscriptionService.getCurrentSubscription(user.id);
      request.subscription = subscription;
    } catch (error) {
      // Ignore si pas trouvé
    }

    return true;
  }
}