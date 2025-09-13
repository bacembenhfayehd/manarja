import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentException, PaymentNotFoundError } from '../exceptions/payment.exception';
import { StripeService } from '../providers/stripe/stripe.service';
import { PaypalService } from '../providers/paypal/paypal.service';
import { PaymentProviderInterface } from '../interfaces/payment-provider.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private paypalService: PaypalService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto) {
    try {
      const provider = this.getPaymentProvider(createPaymentDto.provider);
      
      // Créer le paiement dans la base de données
      const payment = await this.prisma.payment.create({
        data: {
          userId: createPaymentDto.userId,
          invoiceId: createPaymentDto.invoiceId,
          subscriptionId: createPaymentDto.subscriptionId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          paymentType: createPaymentDto.paymentType,
          provider: createPaymentDto.provider,
          status: PaymentStatus.PENDING,
          metadata: createPaymentDto.metadata,
        },
        include: {
          user: true,
          invoice: true,
          subscription: true,
        },
      });

      // Créer le paiement chez le fournisseur
      const providerResponse = await provider.createPayment({
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        description: createPaymentDto.description,
        customerId: payment.user.stripeCustomerId || payment.user.paypalCustomerId,
        metadata: {
          paymentId: payment.id,
          userId: payment.userId,
          ...createPaymentDto.metadata,
        },
      });

      // Mettre à jour avec les informations du fournisseur
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: providerResponse.id,
          status: PaymentStatus.PROCESSING,
          gatewayData: providerResponse,
        },
        include: {
          user: true,
          invoice: true,
          subscription: true,
        },
      });

      return {
        ...updatedPayment,
        clientSecret: providerResponse.clientSecret,
        paymentUrl: providerResponse.paymentUrl,
      };
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      throw new PaymentException('Failed to create payment');
    }
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        invoice: true,
        subscription: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new PaymentNotFoundError(id);
    }

    return payment;
  }

  async getUserPayments(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        include: {
          invoice: true,
          subscription: true,
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, providerData?: any) {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        gatewayData: providerData,
        paymentDate: status === PaymentStatus.SUCCEEDED ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        invoice: true,
        subscription: true,
      },
    });

    // Mettre à jour la facture si le paiement est réussi
    if (status === PaymentStatus.SUCCEEDED && payment.invoiceId) {
      await this.updateInvoiceStatus(payment.invoiceId, payment.amount);
    }

    return payment;
  }

  async createRefund(createRefundDto: CreateRefundDto) {
    const payment = await this.getPayment(createRefundDto.paymentId);
    
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new PaymentException('Cannot refund a payment that is not successful');
    }

    const refundAmount = createRefundDto.amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      throw new PaymentException('Refund amount cannot exceed payment amount');
    }

    const provider = this.getPaymentProvider(payment.provider);
    
    try {
      const refund = await this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          userId: createRefundDto.userId,
          amount: refundAmount,
          currency: payment.currency,
          reason: createRefundDto.reason,
          provider: payment.provider,
          status: PaymentStatus.PENDING,
          metadata: createRefundDto.metadata,
        },
      });

      const providerResponse = await provider.createRefund(
        payment.providerPaymentId,
        refundAmount,
      );

      const updatedRefund = await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          providerRefundId: providerResponse.id,
          status: PaymentStatus.PROCESSING,
        },
      });

      return updatedRefund;
    } catch (error) {
      this.logger.error('Error creating refund:', error);
      throw new PaymentException('Failed to create refund');
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

  private async updateInvoiceStatus(invoiceId: string, paidAmount: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return;

    const newPaidAmount = invoice.paidAmount.toNumber() + paidAmount;
    const totalAmount = invoice.totalAmount.toNumber();

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= totalAmount ? 'PAID' : 'SENT',
      },
    });
  }
}