import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Get project KPIs
  async getProjectKPIs(projectId?: string, userId?: string) {
    const projectWhere = projectId ? { id: projectId } : userId ? { userId } : {};
    
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: {
          include: {
            timeLogs: true
          }
        },
        expenses: true
      }
    });

    const kpis = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
      completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
      totalTasks: 0,
      completedTasks: 0,
      totalHours: 0,
      totalExpenses: 0,
      avgProjectProgress: 0
    };

    let totalProgress = 0;

    projects.forEach(project => {
      const projectTasks = project.tasks.length;
      const projectCompletedTasks = project.tasks.filter(t => 
        t.status === 'COMPLETED'
      ).length;
      
      kpis.totalTasks += projectTasks;
      kpis.completedTasks += projectCompletedTasks;
      
      kpis.totalHours += project.tasks.reduce((sum, task) => 
        sum + task.timeLogs.reduce((taskSum, log) => taskSum + log.duration, 0), 0
      );
      
      kpis.totalExpenses += project.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      const projectProgress = projectTasks > 0 ? (projectCompletedTasks / projectTasks) * 100 : 0;
      totalProgress += projectProgress;
    });

    kpis.avgProjectProgress = projects.length > 0 ? totalProgress / projects.length : 0;

    return kpis;
  }

  // Get time tracking analytics
  async getTimeAnalytics(projectId?: string, userId?: string) {
    const timeWhere: any = {};
    if (projectId) timeWhere.task = { projectId };
    if (userId) timeWhere.userId = userId;

    const timeLogs = await this.prisma.timeLog.findMany({
      where: timeWhere,
      include: {
        user: { select: { firstName: true } },
        task: {
          include: {
            project: { select: { name: true } }
          }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 30 // Last 30 entries
    });

    // Group by day for chart
    const dailyHours = timeLogs.reduce((acc, log) => {
      const date = log.startTime.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + log.duration;
      return acc;
    }, {});

    // Group by user
    const userHours = timeLogs.reduce((acc, log) => {
      acc[log.user.firstName] = (acc[log.user.firstName] || 0) + log.duration;
      return acc;
    }, {});

    return {
      dailyHours: Object.entries(dailyHours).map(([date, hours]) => ({ date, hours })),
      userHours: Object.entries(userHours).map(([user, hours]) => ({ user, hours })),
      totalHours: timeLogs.reduce((sum, log) => sum + log.duration, 0)
    };
  }

  // Get expense analytics
  async getExpenseAnalytics(projectId?:string, userId?: string) {
    const expenseWhere: any = {};
    if (projectId) expenseWhere.projectId = projectId;
    if (userId) expenseWhere.userId = userId;

    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: {
        project: { select: { name: true } }
      }
    });

    // Group by category
    const categoryExpenses = expenses.reduce((acc, expense) => {
      acc[expense.expenseType] = (acc[expense.expenseType] || 0) + expense.amount;
      return acc;
    }, {});

    // Group by month
    const monthlyExpenses = expenses.reduce((acc, expense) => {
      const month = expense.expenseDate.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});

    return {
      categoryBreakdown: Object.entries(categoryExpenses).map(([category, amount]) => ({ 
        category, 
        amount 
      })),
      monthlyTrend: Object.entries(monthlyExpenses).map(([month, amount]) => ({ 
        month, 
        amount 
      })),
      totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    };
  }

  // Get task status distribution
  async getTaskStatusDistribution(projectId?: string, userId?:string) {
    const taskWhere: any = {};
    if (projectId) taskWhere.projectId = projectId;
    if (userId) taskWhere.project = { userId };

    const tasks = await this.prisma.task.findMany({
      where: taskWhere,

    });

    const statusDistribution = tasks.reduce((acc, task) => {
      const status = task.status || 'NO_STATUS';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count
    }));
  }
}
