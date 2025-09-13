import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryValuationService } from '../services/inventory-valuation.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly transactionsService: InventoryTransactionsService,
    private readonly valuationService: InventoryValuationService,
  ) {}

  // === TRANSACTIONS ===
  @Get('transactions')
  async getTransactions(
    @Query('companyId') companyId: string,
    @Query('productId') productId?: string,
    @Query('projectId') projectId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.transactionsService.findAll(companyId, {
      productId,
      projectId,
      type,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post('transactions/receipt')
  async recordReceipt(@Body() receiptDto: any) {
    return this.transactionsService.recordReceipt(receiptDto);
  }

  @Post('transactions/issue')
  async recordIssue(@Body() issueDto: any) {
    return this.transactionsService.recordIssue(issueDto);
  }

  @Post('transactions/adjustment')
  async recordAdjustment(@Body() adjustmentDto: any) {
    return this.transactionsService.recordAdjustment(adjustmentDto);
  }

  @Post('transactions/transfer')
  async recordTransfer(@Body() transferDto: any) {
    return this.transactionsService.recordTransfer(transferDto);
  }

  @Post('transactions/return')
  async recordReturn(@Body() returnDto: any) {
    return this.transactionsService.recordReturn(returnDto);
  }

  // === BALANCES ===
  @Get('balances')
  async getBalances(
    @Query('companyId') companyId: string,
    @Query('location') location?: string,
    @Query('productId') productId?: string,
  ) {
    return this.valuationService.getBalances(companyId, { location, productId });
  }

  @Get('balances/product/:productId')
  async getProductBalance(@Param('productId') productId: string) {
    return this.valuationService.getProductBalance(productId);
  }

  @Get('balances/summary/:companyId')
  async getBalancesSummary(@Param('companyId') companyId: string) {
    return this.valuationService.getBalancesSummary(companyId);
  }

  @Post('balances/recalculate/:companyId')
  async recalculateBalances(@Param('companyId') companyId: string) {
    return this.valuationService.recalculateAllBalances(companyId);
  }

  // === VALUATION & REPORTING ===
  @Get('valuation/inventory-value/:companyId')
  async getInventoryValue(
    @Param('companyId') companyId: string,
    @Query('method') method: string = 'AVERAGE', // FIFO, LIFO, AVERAGE
  ) {
    return this.valuationService.calculateInventoryValue(companyId, method);
  }

  @Get('valuation/cost-of-goods-sold/:companyId')
  async getCostOfGoodsSold(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.valuationService.calculateCOGS(companyId, startDate, endDate);
  }

  @Get('reports/inventory-aging/:companyId')
  async getInventoryAging(@Param('companyId') companyId: string) {
    return this.valuationService.getInventoryAging(companyId);
  }

  @Get('reports/turnover-analysis/:companyId')
  async getTurnoverAnalysis(@Param('companyId') companyId: string) {
    return this.valuationService.getTurnoverAnalysis(companyId);
  }

  @Get('reports/stock-movement/:productId')
  async getStockMovement(
    @Param('productId') productId: string,
    @Query('days') days: number = 30,
  ) {
    return this.transactionsService.getStockMovement(productId, days);
  }

  // === UTILITIES ===
  @Get('alerts/low-stock/:companyId')
  async getLowStockAlerts(@Param('companyId') companyId: string) {
    return this.valuationService.getLowStockAlerts(companyId);
  }

  @Get('alerts/expired-items/:companyId')
  async getExpiredItems(@Param('companyId') companyId: string) {
    return this.valuationService.getExpiredItems(companyId);
  }

  @Post('optimize/reorder-suggestions/:companyId')
  async getReorderSuggestions(@Param('companyId') companyId: string) {
    return this.valuationService.generateReorderSuggestions(companyId);
  }
}