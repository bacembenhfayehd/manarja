import { Module } from '@nestjs/common';
import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentController } from './controllers/payment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceController, PaymentController],
  providers: [InvoiceService, PaymentService],
  exports: [InvoiceService, PaymentService]
})
export class InvoiceModule {}