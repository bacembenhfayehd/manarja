import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PurchaseOrdersController } from './purchase-order.controller';
import { PurchaseOrdersService } from './purchase-order.service';
import { VendorsModule } from 'src/vendor/vendor.module';
import { EstimatesModule } from 'src/estimates/estimates.module';


@Module({
  imports: [PrismaModule, VendorsModule, EstimatesModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}