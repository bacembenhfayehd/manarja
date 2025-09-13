import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelGeneratorUtil {

  // Generate Excel report
  generateReportExcel(reportData: any, reportType: string): Buffer {
    const workbook = XLSX.utils.book_new();

    switch (reportType) {
      case 'PROJECT_OVERVIEW':
        this.addProjectOverviewSheet(workbook, reportData);
        break;
      case 'TIME_TRACKING':
        this.addTimeTrackingSheet(workbook, reportData);
        break;
      case 'EXPENSE_SUMMARY':
        this.addExpenseSheet(workbook, reportData);
        break;
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private addProjectOverviewSheet(workbook: any, data: any[]) {
    const worksheetData = data.map(project => ({
      'Project Name': project.projectName,
      'Owner': project.owner,
      'Total Tasks': project.totalTasks,
      'Completed Tasks': project.completedTasks,
      'Total Hours': project.totalHours,
      'Total Expenses': project.totalExpenses,
      'Progress (%)': project.progress
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Overview');
  }

  private addTimeTrackingSheet(workbook: any, data: any[]) {
    const worksheetData = data.map(entry => ({
      'User Name': entry.userName,
      'Project': entry.projectName,
      'Total Hours': entry.totalHours,
      'Entries Count': entry.entries.length
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Tracking');
  }

  private addExpenseSheet(workbook: any, data: any[]) {
    const worksheetData = data.map(category => ({
      'Category': category.category,
      'Total Amount': category.totalAmount,
      'Count': category.count
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
  }
}