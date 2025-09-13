import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { InvoiceStatus } from '../types/invoice.types';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const currentPaidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const newTotalPaid = currentPaidAmount + Number(createPaymentDto.amount);
    const invoiceTotal = Number(invoice.totalAmount);

    if (newTotalPaid > invoiceTotal) {
      throw new BadRequestException('Payment amount exceeds invoice total');
    }

    // Créer le paiement
    const payment = await this.prisma.payment.create({
      data: createPaymentDto,
      include: {
        invoice: true
      }
    });

    // Mettre à jour le montant payé de la facture
    await this.prisma.invoice.update({
      where: { id: createPaymentDto.invoiceId },
      data: {
        paidAmount: newTotalPaid,
        status: newTotalPaid >= invoiceTotal ? InvoiceStatus.PAID : invoice.status
      }
    });

    return payment;
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            client: true,
            project: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByInvoice(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            client: true,
            project: true
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    
    // Mettre à jour le montant payé de la facture
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: { decrement: payment.amount },
        status: InvoiceStatus.SENT // Remettre en "envoyé" si c'était payé
      }
    });

    return this.prisma.payment.delete({
      where: { id }
    });
  }
}