import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '../enums/payment-status.enum';
import { RefundNotAllowedError } from '../exceptions/payment.exception';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);
  
  constructor(private prisma: PrismaService) {}

  async getRefund(id: string) {
    return this.prisma.refund.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            user: true,
            invoice: true,
            subscription: true,
          },
        },
        user: true,
      },
    });
  }

  async getUserRefunds(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where: { userId },
        include: {
          payment: {
            include: {
              invoice: true,
              subscription: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refund.count({ where: { userId } }),
    ]);

    return {
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRefundStatus(id: string, status: PaymentStatus, providerData?: any) {
    const refund = await this.prisma.refund.update({
      where: { id },
      data: {
        status,
        metadata: providerData,
        updatedAt: new Date(),
      },
      include: {
        payment: true,
        user: true,
      },
    });

    // updated status payment if payment success
    if (status === PaymentStatus.SUCCEEDED) {
      await this.updateParentPaymentStatus(refund);
    }

    return refund;
  }

  private async updateParentPaymentStatus(refund: any) {
    const payment = refund.payment;
    const totalRefunded = await this.prisma.refund.aggregate({
      where: {
        paymentId: payment.id,
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: { amount: true },
    });

    const refundedAmount = totalRefunded._sum.amount || 0;
    const paymentAmount = payment.amount;

    let newStatus = payment.status;
    if (refundedAmount >= paymentAmount) {
      newStatus = PaymentStatus.REFUNDED;
    } else if (refundedAmount > 0) {
      newStatus = PaymentStatus.PARTIALLY_REFUNDED;
    }

    if (newStatus !== payment.status) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });
    }
  }
}