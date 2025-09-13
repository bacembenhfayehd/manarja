import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaymentProvider } from '../enums/payment-provider.enum';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provider = this.reflector.get<PaymentProvider>('provider', context.getHandler());
    
    if (!provider) {
      throw new UnauthorizedException('Payment provider not specified');
    }

    const signature = this.getSignature(request, provider);
    
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    // La validation réelle se fera dans le service spécifique
    request.webhookSignature = signature;
    request.provider = provider;
    
    return true;
  }

  private getSignature(request: any, provider: PaymentProvider): string | undefined {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return request.headers['stripe-signature'];
      case PaymentProvider.PAYPAL:
        return request.headers['paypal-transmission-sig'];
      default:
        return undefined;
    }
  }
}