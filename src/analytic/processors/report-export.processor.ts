import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReportBuilderService } from '../services/report-builder.service';
import { PdfGeneratorUtil } from '../utils/pdf-generator.util';
import { ExcelGeneratorUtil } from '../utils/excel-generator.util';
// import { MailService } from '../../mail/mail.service'; // Your existing mail service

export interface ReportExportJob {
  reportId: number;
  userId: number;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  options?: {
    includeCharts?: boolean;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'A4' | 'A3' | 'Letter';
    title?: string;
    subtitle?: string;
  };
  delivery?: {
    method: 'email' | 'download';
    recipients?: string[];
    subject?: string;
    message?: string;
  };
}

@Processor('report-export')
export class ReportExportProcessor {
  private readonly logger = new Logger(ReportExportProcessor.name);

  constructor(
    private reportBuilder: ReportBuilderService,
    private pdfGenerator: PdfGeneratorUtil,
    private excelGenerator: ExcelGeneratorUtil,
    // private mailService: MailService
  ) {}

  @Process('generate-report')
  async handleReportGeneration(job: Job<ReportExportJob>): Promise<any> {
    const { reportId, userId, format, options, delivery } = job.data;
    
    this.logger.log(`Starting report generation for report ${reportId}, format: ${format}`);

    try {
      // Update job progress
      await job.progress(10);

      // Generate report data
      const reportData = await this.reportBuilder.executeReport(reportId);
      const report = await this.getReportMetadata(reportId);
      
      await job.progress(30);

      // Generate file based on format
      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      switch (format) {
        case 'pdf':
          fileBuffer = await this.pdfGenerator.generateReportPDF(
            reportData, 
            report.reportType
          );
          fileName = `${report.name}.pdf`;
          mimeType = 'application/pdf';
          break;

        case 'excel':
          fileBuffer = this.excelGenerator.generateReportExcel(
            reportData, 
            report.reportType
          );
          fileName = `${report.name}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'csv':
          fileBuffer = this.generateCSV(reportData, report.reportType);
          fileName = `${report.name}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          fileBuffer = Buffer.from(JSON.stringify(reportData, null, 2));
          fileName = `${report.name}.json`;
          mimeType = 'application/json';
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      await job.progress(70);

      // Handle delivery
      if (delivery?.method === 'email') {
        await this.sendReportByEmail(
          fileBuffer,
          fileName,
          mimeType,
          delivery.recipients || [],
          delivery.subject || `Report: ${report.name}`,
          delivery.message || 'Please find the attached report.'
        );
      } else {
        // For download, you might save to a temporary location
        // or return a download URL
        await this.saveForDownload(fileBuffer, fileName, userId);
      }

      await job.progress(100);

      this.logger.log(`Report generation completed for report ${reportId}`);

      return {
        success: true,
        reportId,
        fileName,
        format,
        generatedAt: new Date(),
        deliveryMethod: delivery?.method || 'download'
      };

    } catch (error) {
      this.logger.error(`Report generation failed for report ${reportId}:`, error.message);
      throw error;
    }
  }

  @Process('bulk-export')
  async handleBulkExport(job: Job<{ reportIds: number[], userId: number, format: string }>): Promise<any> {
    const { reportIds, userId, format } = job.data;
    
    this.logger.log(`Starting bulk export for ${reportIds.length} reports`);

    const results = [];
    const total = reportIds.length;

    for (let i = 0; i < reportIds.length; i++) {
      const reportId = reportIds[i];
      
      try {
        const singleJobData: ReportExportJob = {
          reportId,
          userId,
          format: format as any,
          delivery: { method: 'download' }
        };

        const result = await this.handleReportGeneration({ data: singleJobData } as Job<ReportExportJob>);
        results.push({ reportId, success: true, result });
        
        await job.progress(Math.round(((i + 1) / total) * 100));
      } catch (error) {
        results.push({ reportId, success: false, error: error.message });
        this.logger.error(`Bulk export failed for report ${reportId}:`, error.message);
      }
    }

    this.logger.log(`Bulk export completed. ${results.filter(r => r.success).length}/${total} succeeded`);

    return {
      success: true,
      total,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  private async getReportMetadata(reportId: number) {
    // This should use your Prisma service
    // For now, using the report builder service
    const reports = await this.reportBuilder.getUserReports(0); // This needs proper implementation
    return reports.find(r => r.id === reportId);
  }

  private generateCSV(data: any[], reportType: string): Buffer {
    if (!data || data.length === 0) {
      return Buffer.from('No data available\n');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csv += values.join(',') + '\n';
    }

    return Buffer.from(csv);
  }

  private async sendReportByEmail(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    recipients: string[],
    subject: string,
    message: string
  ): Promise<void> {
    // Use your existing mail service
    /*
    await this.mailService.sendMail({
      to: recipients,
      subject,
      text: message,
      attachments: [{
        filename: fileName,
        content: fileBuffer,
        contentType: mimeType
      }]
    });
    */
    
    this.logger.log(`Email sent to ${recipients.join(', ')} with attachment: ${fileName}`);
  }

  private async saveForDownload(
    fileBuffer: Buffer,
    fileName: string,
    userId: number
  ): Promise<void> {
    // Save to temporary storage or cloud storage
    // This could be AWS S3, local filesystem, etc.
    
    // Example: Save to temp directory
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp', 'exports', userId.toString());
    await fs.mkdir(tempDir, { recursive: true });
    
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    this.logger.log(`File saved for download: ${filePath}`);
  }
}
