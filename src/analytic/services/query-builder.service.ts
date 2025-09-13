import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class QueryBuilderService {
  constructor(private prisma: PrismaService) {}

  // Build dynamic project query with filters
  buildProjectQuery(filters: any) {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo)
      };
    }
    
    return where;
  }

  // Build task query with status filters
  buildTaskQuery(filters: any) {
    const where: any = {};
    
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.status) where.taskStatusId = filters.status;
    if (filters.priority) where.priority = filters.priority;
    
    return where;
  }

  // Build time log aggregation query
  buildTimeLogQuery(filters: any) {
    const where: any = {};
    
    if (filters.projectId) where.task = { projectId: filters.projectId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.dateFrom && filters.dateTo) {
      where.logDate = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo)
      };
    }
    
    return where;
  }

  // Build expense query
  buildExpenseQuery(filters: any) {
    const where: any = {};
    
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.category) where.category = filters.category;
    if (filters.dateFrom && filters.dateTo) {
      where.expenseDate = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo)
      };
    }
    
    return where;
  }
}