// src/budget/budget.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BudgetController } from './controllers/budget.controller';
import { BudgetTrackingController } from './controllers/budget-tracking.controller';
import { BudgetService } from './services/budget.service';
import { BudgetTrackingService } from './services/budget-tracking.service';


@Module({
  imports: [PrismaModule],
  controllers: [BudgetController, BudgetTrackingController],
  providers: [BudgetService, BudgetTrackingService],
  exports: [BudgetService, BudgetTrackingService],
})
export class BudgetModule {}