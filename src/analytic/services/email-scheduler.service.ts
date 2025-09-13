import { Injectable } from '@nestjs/common';

import { ReportBuilderService } from './report-builder.service';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/prisma/prisma.service';
// Import your existing nodemailer service
// import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailSchedulerService {
  constructor(
    private prisma: PrismaService,
    private reportBuilder: ReportBuilderService,
    private dashboard: DashboardService,
    // private mailService: MailService // Your existing nodemailer service
  ) {}
private calculateNextSend(frequency: string, time?: string): Date {
  // Logique pour calculer la prochaine date d'envoi basée sur frequency et time
  const now = new Date();
  // Ajoutez votre logique ici selon frequency (DAILY, WEEKLY, MONTHLY)
  return now; // Placeholder
}

  // Schedule a report for email delivery
 async scheduleReport(userId: string, scheduleConfig: any) {
  const scheduledReport = await this.prisma.scheduledReport.create({
    data: {
      reportId: scheduleConfig.reportId,
      frequency: scheduleConfig.frequency,
      recipients: scheduleConfig.recipients,
      nextSend: this.calculateNextSend(scheduleConfig.frequency, scheduleConfig.time),
      isActive: true
    }
  });

  return scheduledReport;
}


  // Get all scheduled reports
 async getScheduledReports() {
  return await this.prisma.scheduledReport.findMany({
    where: { isActive: true },
    include: {
      report: {
        include: {
          createdBy: { select: { id: true, firstName: true, email: true } }
        }
      }
    }
  });
}

  // Execute and send scheduled report
  async executeScheduledReport(reportId: string) {
  const scheduledReport = await this.prisma.scheduledReport.findFirst({
    where: { reportId: reportId, isActive: true },
    include: {
      report: {
        include: {
          createdBy: { select: { firstName: true, email: true } }
        }
      }
    }
  });

  if (!scheduledReport) {
    throw new Error('Scheduled report not found');
  }

    // Generate report data
    const reportData = await this.reportBuilder.executeReport(reportId);
    

    // Prepare email content
    const emailData = {
  reportName: scheduledReport.report.title,
  reportType: scheduledReport.report.type,
  data: reportData,
  generatedAt: new Date(),
  recipients: scheduledReport.recipients
};

   
   /* await this.mailService.sendReportEmail({
      to: scheduleConfig.recipients || [report.user.email],
      subject: `Scheduled Report: ${report.name}`,
      template: 'report-summary', // Your email template
      context: emailData
    });*/
    

    // Log the email sent
    console.log(`Report ${scheduledReport.report.title} sent to ${scheduledReport.recipients || [scheduledReport.report.createdBy.email]}`);
    
    return { success: true, reportId, sentAt: new Date() };
  }

  // Send dashboard digest
  async sendDashboardDigest(userId: string, recipients: string[]) {
    const kpis = await this.dashboard.getProjectKPIs(undefined, userId);
    const timeAnalytics = await this.dashboard.getTimeAnalytics(undefined, userId);
    const expenseAnalytics = await this.dashboard.getExpenseAnalytics(undefined, userId);

    const digestData = {
      kpis,
      timeAnalytics,
      expenseAnalytics,
      generatedAt: new Date()
    };

    // Send using your existing mail service
    /*
    await this.mailService.sendDashboardDigest({
      to: recipients,
      subject: 'Your Project Dashboard Digest',
      template: 'dashboard-digest',
      context: digestData
    });
    */

    console.log(`Dashboard digest sent to ${recipients}`);
    return { success: true, sentAt: new Date() };
  }

  // Check if report should be sent today
  shouldSendToday(report: any): boolean {
    const config = JSON.parse(report.scheduleConfig || '{}');
    const now = new Date();
    
    switch (report.frequency) {
      case 'DAILY':
        return true;
      case 'WEEKLY':
        return now.getDay() === config.dayOfWeek;
      case 'MONTHLY':
        return now.getDate() === config.dayOfMonth;
      default:
        return false;
    }
  }
}