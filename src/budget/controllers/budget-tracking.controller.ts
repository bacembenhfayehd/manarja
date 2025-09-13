
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetTrackingService } from '../services/budget-tracking.service';

import { RecordExpenseDto } from '../dto/record-expense.dto';
import { BudgetQueryDto } from '../dto/budget-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('budget-tracking')
@UseGuards(JwtAuthGuard)
export class BudgetTrackingController {
  constructor(private readonly budgetTrackingService: BudgetTrackingService) {}

  /**
   * Récupère le suivi budgétaire d'un projet
   */
  @Get('project/:projectId')
  async getProjectBudgetTracking(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.budgetTrackingService.createBudgetTracking(projectId);
  }

  /**
   * Enregistre une nouvelle dépense
   */
  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  async recordExpense(
    @Body() expenseData: RecordExpenseDto,
    @Request() req,
  ) {
    return this.budgetTrackingService.recordExpense({
      ...expenseData,
      expenseDate: new Date(expenseData.expenseDate),
      createdBy: req.user.sub,
    });
  }

  /**
   * Récupère les dépenses d'un budget
   */
  @Get('budget/:budgetId/expenses')
  async getBudgetExpenses(
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Query() query: BudgetQueryDto,
  ) {
    return this.budgetTrackingService.getBudgetExpenses(budgetId, query);
  }

  /**
   * Approuve une dépense
   */
  @Put('expenses/:expenseId/approve')
  async approveExpense(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Request() req,
  ) {
    return this.budgetTrackingService.approveExpense(expenseId, req.user.sub);
  }

  /**
   * Rejette une dépense
   */
  @Put('expenses/:expenseId/reject')
  async rejectExpense(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Body() data: { reason?: string },
    @Request() req,
  ) {
    return this.budgetTrackingService.rejectExpense(
      expenseId,
      req.user.sub,
      data.reason,
    );
  }

  /**
   * Met à jour une dépense
   */
  @Put('expenses/:expenseId')
  async updateExpense(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Body() updateData: Partial<RecordExpenseDto>,
    @Request() req,
  ) {
    return this.budgetTrackingService.updateExpense(
      expenseId,
      updateData,
      req.user.sub,
    );
  }

  /**
   * Supprime une dépense
   */
  @Delete('expenses/:expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Request() req,
  ) {
    return this.budgetTrackingService.deleteExpense(expenseId, req.user.sub);
  }

  /**
   * Récupère l'historique du suivi budgétaire
   */
  @Get('budget/:budgetId/history')
  async getBudgetTrackingHistory(
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Query('limit') limit?: number,
  ) {
    return this.budgetTrackingService.getBudgetTrackingHistory(
      budgetId,
      limit ? parseInt(limit.toString()) : 30,
    );
  }

  /**
   * Génère des alertes budgétaires
   */
  @Get('project/:projectId/alerts')
  async generateBudgetAlerts(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.budgetTrackingService.generateBudgetAlerts(projectId);
  }

  /**
   * Génère un rapport de variance
   */
  @Get('project/:projectId/variance-report')
  async generateVarianceReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.budgetTrackingService.generateVarianceReport(
      projectId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Met à jour manuellement le suivi budgétaire
   */
  @Post('budget/:budgetId/update')
  async updateBudgetTracking(
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Request() req,
  ) {
    return this.budgetTrackingService.updateBudgetTracking(
      budgetId,
      req.user.sub,
    );
  }

  /**
   * Récupère le tableau de bord budgétaire
   */
  @Get('project/:projectId/dashboard')
  async getBudgetDashboard(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.budgetTrackingService.getBudgetDashboard(projectId);
  }

  /**
   * Exporte le rapport budgétaire
   */
  @Get('project/:projectId/export')
  async exportBudgetReport(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('format') format: 'pdf' | 'excel' = 'pdf',
  ) {
    return this.budgetTrackingService.exportBudgetReport(projectId, format);
  }

  /**
   * Récupère les tendances budgétaires
   */
  @Get('project/:projectId/trends')
  async getBudgetTrends(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ) {
    return this.budgetTrackingService.getBudgetTrends(projectId, period);
  }
}