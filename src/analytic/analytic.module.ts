import { Module } from "@nestjs/common";
import { ReportsController } from "./controllers/reports-controller";
import { EmailReportsController } from "./controllers/email-reports.controller";
import { DashboardsController } from "./controllers/dashboards.controller";
import { DashboardService } from "./services/dashboard.service";
import { EmailSchedulerService } from "./services/email-scheduler.service";
import { QueryBuilderService } from "./services/query-builder.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  controllers: [
    ReportsController,
    EmailReportsController,
    DashboardsController
  ],
  providers: [
    DashboardService,
    EmailSchedulerService,
    QueryBuilderService,
    DashboardService
  ],
  imports: [PrismaModule, ScheduleModule.forRoot(), MailerModule],
})
export class AnalyticsModule {}
