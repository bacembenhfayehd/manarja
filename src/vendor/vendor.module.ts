import { Module } from '@nestjs/common';
;
import { VendorsService } from './vendors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VendorsController } from './vendor.controller';

@Module({
  imports: [PrismaModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}