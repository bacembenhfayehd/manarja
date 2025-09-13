// decorators/current-subscription.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentSubscription = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.subscription;
  },
);

// Exemple d'utilisation:
// async someMethod(@CurrentSubscription() subscription: Subscription) { ... }