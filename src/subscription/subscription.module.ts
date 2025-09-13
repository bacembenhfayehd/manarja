
import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { FeatureGuard } from './guards/feature.guard';
import { PlanGuard } from './guards/plan.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
 imports: [PrismaModule],
 controllers: [SubscriptionController],
 providers: [
   SubscriptionService,
   SubscriptionGuard,
   FeatureGuard,
   PlanGuard,
 ],
 exports: [
   SubscriptionService,
   SubscriptionGuard,
   FeatureGuard,
   PlanGuard,
 ],
})
export class SubscriptionModule {}