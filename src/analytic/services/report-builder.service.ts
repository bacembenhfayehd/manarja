import { Injectable } from '@nestjs/common';

import { QueryBuilderService } from './query-builder.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportBuilderService {
  constructor(
    private prisma: PrismaService,
    private queryBuilder: QueryBuilderService
  ) {}

  // Generate project overview report
  async generateProjectReport(filters: any) {
    const projectWhere = this.queryBuilder.buildProjectQuery(filters);
    
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: {
          include: {
            timeLogs: true
          }
        },
        expenses: true,
        //need to add user project information herer , will discuss after testing api
      }
    });

    return projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
      totalHours: project.tasks.reduce((sum, task) => 
        sum + task.timeLogs.reduce((taskSum, log) => taskSum + log.duration, 0), 0
      ),
      totalExpenses: project.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
      progress: project.tasks.length > 0 
        ? Math.round((project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100)
        : 0
    }));
  }

  // Generate time tracking report
  async generateTimeReport(filters: any) {
    const timeWhere = this.queryBuilder.buildTimeLogQuery(filters);
    
    const timeLogs = await this.prisma.timeLog.findMany({
      where: timeWhere,
      include: {
        user: { select: { id: true, firstName: true } },
        task: {
          include: {
            project: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Group by user and project
    const grouped = timeLogs.reduce((acc, log) => {
      const key = `${log.userId}-${log.task.project.id}`;
      if (!acc[key]) {
        acc[key] = {
          userId: log.userId,
          userName: log.user.firstName,
          projectId: log.task.project.id,
          projectName: log.task.project.name,
          totalHours: 0,
          entries: []
        };
      }
      acc[key].totalHours += log.duration;
      acc[key].entries.push({
        date: log.startTime,
        hours: log.duration,
        description: log.description
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Generate expense report
  async generateExpenseReport(filters: any) {
    const expenseWhere = this.queryBuilder.buildExpenseQuery(filters);
    
    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true } }
      }
    });

    // Group by category and project
    const byCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.expenseType]) {
        acc[expense.expenseType] = {
          category: expense.expenseType,
          totalAmount: 0,
          count: 0,
          projects: {}
        };
      }
      acc[expense.expenseType].totalAmount += expense.amount;
      acc[expense.expenseType].count++;
      
      if (!acc[expense.expenseType].projects[expense.project.id]) {
        acc[expense.expenseType].projects[expense.project.id] = {
          projectName: expense.project.name,
          amount: 0
        };
      }
      acc[expense.expenseType].projects[expense.project.id].amount += expense.amount;
      
      return acc;
    }, {});

    return Object.values(byCategory);
  }

  // Save custom report configuration
 async saveReportConfig(userId: string, reportConfig: any) {
  return await this.prisma.report.create({
    data: {
      title: reportConfig.name,
      description: reportConfig.description,
      type: reportConfig.reportType,
       config: reportConfig.config || {},
      filters: JSON.stringify(reportConfig.filters),
      createdById: userId, 
    }
  });
}

  // Get saved reports for user
  async getUserReports(userId: string) {
    return await this.prisma.report.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Execute saved report
  async executeReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: id }
    });

    if (!report) throw new Error('Report not found');

     const filters = report.filters ? JSON.parse(report.filters as string) : {};
    
    switch (report.type) {
      case 'PROJECT_OVERVIEW':
        return await this.generateProjectReport(filters);
      case 'TIME_TRACKING':
        return await this.generateTimeReport(filters);
      case 'EXPENSE_SUMMARY':
        return await this.generateExpenseReport(filters);
      default:
        throw new Error('Unknown report type');
    }
  }
}