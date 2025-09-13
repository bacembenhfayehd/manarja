import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { BudgetModule } from './budget/budget.module';
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PurchaseModule } from './purchase/purchase.module';
import { VendorModule } from './vendor/vendor.module';
import { EstimatesModule } from './estimates/estimates.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { WebhookModule } from './webhook/webhook.module';
import { CompanyModule } from './company/company.module';
import { BrandingModule } from './branding/branding.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { DocumentSearchSystemModule } from './document-search-system/document/document.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { ContactsModule } from './contacts/contacts.module';
import { CommunicationsModule } from './communications/communications.module';
import { TrackingModule } from './tracking/tracking.module';
import { OvertimeReportModule } from './overtime-report/overtime-report.module';
import { WeeklyReportModule } from './weekly-report/weekly-report.module';
import { InventoryModule } from './inventory/inventory.module';
import { CommunicationModule } from './communication/communication.module';
import { CalendarModule } from './calendar/calendar.module';
import { AnalyticModule } from './analytic/analytic.module';
import { ReportsModule } from './reports/reports.module';
import { KpisModule } from './kpis/kpis.module';
import { ScheduledReportsModule } from './scheduled-reports/scheduled-reports.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, BudgetModule, PaymentModule, InvoiceModule, PurchaseModule, VendorModule, EstimatesModule, SubscriptionPlanModule, WebhookModule, CompanyModule, BrandingModule, SubscriptionModule, DocumentSearchSystemModule, OpportunitiesModule, PipelineModule, ContactsModule, CommunicationsModule, TrackingModule, OvertimeReportModule, WeeklyReportModule, InventoryModule, CommunicationModule, CalendarModule, AnalyticModule, ReportsModule, KpisModule, ScheduledReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
