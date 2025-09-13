import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

@Injectable()
export class PdfGeneratorUtil {

  // Generate PDF report
  async generateReportPDF(reportData: any, reportType: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text('Analytics Report', { align: 'center' });
        doc.fontSize(14).text(`Report Type: ${reportType}`, { align: 'center' });
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Content based on report type
        switch (reportType) {
          case 'PROJECT_OVERVIEW':
            this.addProjectOverviewContent(doc, reportData);
            break;
          case 'TIME_TRACKING':
            this.addTimeTrackingContent(doc, reportData);
            break;
          case 'EXPENSE_SUMMARY':
            this.addExpenseContent(doc, reportData);
            break;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addProjectOverviewContent(doc: any, data: any[]) {
    doc.fontSize(16).text('Project Overview', { underline: true });
    doc.moveDown();

    data.forEach((project, index) => {
      doc.fontSize(14).text(`${index + 1}. ${project.projectName}`);
      doc.fontSize(12)
        .text(`Owner: ${project.owner}`)
        .text(`Total Tasks: ${project.totalTasks}`)
        .text(`Completed Tasks: ${project.completedTasks}`)
        .text(`Total Hours: ${project.totalHours}`)
        .text(`Total Expenses: $${project.totalExpenses}`)
        .text(`Progress: ${project.progress}%`)
        .moveDown();
    });
  }

  private addTimeTrackingContent(doc: any, data: any[]) {
    doc.fontSize(16).text('Time Tracking Report', { underline: true });
    doc.moveDown();

    data.forEach((entry, index) => {
      doc.fontSize(14).text(`${index + 1}. ${entry.userName}`);
      doc.fontSize(12)
        .text(`Project: ${entry.projectName}`)
        .text(`Total Hours: ${entry.totalHours}`)
        .text(`Entries: ${entry.entries.length}`)
        .moveDown();
    });
  }

  private addExpenseContent(doc: any, data: any[]) {
    doc.fontSize(16).text('Expense Summary', { underline: true });
    doc.moveDown();

    data.forEach((category, index) => {
      doc.fontSize(14).text(`${index + 1}. ${category.category}`);
      doc.fontSize(12)
        .text(`Total Amount: $${category.totalAmount}`)
        .text(`Count: ${category.count}`)
        .moveDown();
    });
  }
}
