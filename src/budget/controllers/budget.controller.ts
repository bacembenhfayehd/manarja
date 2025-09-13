import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetService } from '../services/budget.service';

import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { CreateBudgetCategoryDto } from '../dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from '../dto/update-budget-category.dto';
import { BudgetQueryDto } from '../dto/budget-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBudget(@Body() createBudgetDto: CreateBudgetDto, @Request() req) {
    return this.budgetService.createBudget(createBudgetDto, req.user.sub);
  }

  @Get('project/:projectId')
  async getProjectBudgets(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: BudgetQueryDto,
  ) {
    return this.budgetService.getProjectBudgets(projectId, query);
  }

  @Get(':id')
  async getBudgetById(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.getBudgetById(id);
  }

  @Put(':id')
  async updateBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(id, updateBudgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBudget(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.deleteBudget(id);
  }

  @Post(':id/categories')
  async addBudgetCategory(
    @Param('id', ParseUUIDPipe) budgetId: string,
    @Body() createCategoryDto: CreateBudgetCategoryDto,
  ) {
    return this.budgetService.addBudgetCategory(budgetId, createCategoryDto);
  }

  @Put('categories/:categoryId')
  async updateBudgetCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() updateCategoryDto: UpdateBudgetCategoryDto,
  ) {
    return this.budgetService.updateBudgetCategory(
      categoryId,
      updateCategoryDto,
    );
  }

  @Delete('categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBudgetCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.budgetService.deleteBudgetCategory(categoryId);
  }

  @Get(':id/stats')
  async getBudgetStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.getBudgetSummary(id);
  }
}
