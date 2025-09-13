import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class PaymentNotFoundError extends PaymentException {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class PaymentAlreadyProcessedError extends PaymentException {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} has already been processed`, HttpStatus.CONFLICT);
  }
}

export class InsufficientFundsError extends PaymentException {
  constructor() {
    super('Insufficient funds for this transaction', HttpStatus.PAYMENT_REQUIRED);
  }
}

export class InvalidPaymentMethodError extends PaymentException {
  constructor() {
    super('Invalid payment method', HttpStatus.BAD_REQUEST);
  }
}

export class PaymentProviderError extends PaymentException {
  constructor(provider: string, message: string) {
    super(`${provider} error: ${message}`, HttpStatus.BAD_GATEWAY);
  }
}

export class SubscriptionNotFoundError extends PaymentException {
  constructor(subscriptionId: string) {
    super(`Subscription with ID ${subscriptionId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class SubscriptionAlreadyCanceledError extends PaymentException {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} is already canceled`, HttpStatus.CONFLICT);
  }
}

export class RefundNotAllowedError extends PaymentException {
  constructor(reason: string) {
    super(`Refund not allowed: ${reason}`, HttpStatus.FORBIDDEN);
  }
}