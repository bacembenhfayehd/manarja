import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WeeklyReportController } from './weekly-report-controller';
import { WeeklyReportService } from './weekly-report-service.';


@Module({
  imports: [PrismaModule],
  controllers: [WeeklyReportController],
  providers: [WeeklyReportService],
  exports: [WeeklyReportService],
})
export class WeeklyReportModule {}