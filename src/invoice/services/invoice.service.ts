import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { InvoiceStatus } from '../types/invoice.types';
import { Prisma } from '@prisma/client';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceQueryDto } from '../dto/invoice-query.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { items, ...invoiceData } = createInvoiceDto;
    
    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        items: {
          create: items
        }
      },
      include: {
        items: true,
        client: true,
        project: true,
        payments: true
      }
    });
  }

  async findAll(query: InvoiceQueryDto) {
    const where: Prisma.InvoiceWhereInput = {};

    if (query.clientId) where.clientId = query.clientId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.fromDate) where.createdAt = { gte: new Date(query.fromDate) };
    if (query.toDate) where.createdAt = { ...where.createdAt, lte: new Date(query.toDate) };
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        items: true,
        client: true,
        project: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        client: true,
        project: true,
        payments: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const { items, ...invoiceData } = updateInvoiceDto;
    
    const existingInvoice = await this.findOne(id);
    
    if (existingInvoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        ...(items && {
          items: {
            deleteMany: {},
            create: items
          }
        })
      },
      include: {
        items: true,
        client: true,
        project: true,
        payments: true
      }
    });
  }

  async remove(id: string) {
    const invoice = await this.findOne(id);
    
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    return this.prisma.invoice.delete({
      where: { id }
    });
  }

  async markAsSent(id: string) {
    const invoice = await this.findOne(id);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be marked as sent');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date()
      },
      include: {
        items: true,
        client: true,
        project: true,
        payments: true
      }
    });
  }

  async markAsPaid(id: string) {
    const invoice = await this.findOne(id);
    
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    // Vérifier si le montant payé correspond au total
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAmount = Number(invoice.totalAmount);

    if (totalPaid >= totalAmount) {
      return this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAmount: totalAmount
        },
        include: {
          items: true,
          client: true,
          project: true,
          payments: true
        }
      });
    }

    throw new BadRequestException('Invoice cannot be marked as paid: insufficient payments');
  }

  async getStats() {
    const stats = await this.prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true
      },
      _count: true
    });

    const statusCounts = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: true
    });

    return {
      totalInvoices: stats._count,
      totalAmount: stats._sum.totalAmount || 0,
      paidAmount: stats._sum.paidAmount || 0,
      pendingAmount: (stats._sum.totalAmount || 0) - (stats._sum.paidAmount || 0),
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {})
    };
  }

  async getHistory(id: string) {
    // Simulation d'un historique - vous pouvez implémenter une vraie table d'audit
    const invoice = await this.findOne(id);
    
    const history = [
      {
        id: '1',
        invoiceId: id,
        action: 'CREATED',
        details: { status: InvoiceStatus.DRAFT },
        createdAt: invoice.createdAt
      }
    ];

    if (invoice.sentAt) {
      history.push({
        id: '2',
        invoiceId: id,
        action: 'SENT',
        details: { sentAt: invoice.sentAt },
        createdAt: invoice.sentAt
      });
    }

    invoice.payments.forEach((payment, index) => {
      history.push({
        id: `payment-${index}`,
        invoiceId: id,
        action: 'PAYMENT_RECEIVED',
        details: { 
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId
        },
        createdAt: payment.createdAt
      });
    });

    return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}