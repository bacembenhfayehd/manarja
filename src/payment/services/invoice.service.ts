import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  
  constructor(private prisma: PrismaService) {}

  async getInvoice(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        project: true,
        client: true,
        user: true,
        items: true,
        payments: true,
        subscription: true,
      },
    });
  }

  async getUserInvoices(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { userId },
        include: {
          project: true,
          client: true,
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { userId } }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateInvoiceStatus(invoiceId: string, status: string) {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, updatedAt: new Date() },
      include: {
        project: true,
        client: true,
        user: true,
        items: true,
        payments: true,
      },
    });
  }

  async markInvoiceAsPaid(invoiceId: string, paidAmount: number) {
    const invoice = await this.getInvoice(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const newPaidAmount = invoice.paidAmount.toNumber() + paidAmount;
    const totalAmount = invoice.totalAmount.toNumber();

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= totalAmount ? 'PAID' : 'SENT',
        updatedAt: new Date(),
      },
      include: {
        project: true,
        client: true,
        user: true,
        items: true,
        payments: true,
      },
    });
  }
}
