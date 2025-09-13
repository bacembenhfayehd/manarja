import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OvertimeReportController } from './overtime-report.controller';
import { OvertimeReportService } from './overtime-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [OvertimeReportController],
  providers: [OvertimeReportService],
  exports: [OvertimeReportService],
})
export class OvertimeReportModule {}