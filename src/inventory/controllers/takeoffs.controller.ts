import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TakeoffsService } from '../services/takeoffs.service';

@Controller('inventory/takeoffs')
export class TakeoffsController {
  constructor(private readonly takeoffsService: TakeoffsService) {}

  @Get()
  async getTakeoffs(
    @Query('projectId') projectId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.takeoffsService.findAll({ projectId, page, limit });
  }

  @Get(':id')
  async getTakeoff(@Param('id') id: string) {
    return this.takeoffsService.findOne(id);
  }

  @Post()
  async createTakeoff(@Body() createTakeoffDto: any) {
    return this.takeoffsService.create(createTakeoffDto);
  }

  @Put(':id')
  async updateTakeoff(@Param('id') id: string, @Body() updateTakeoffDto: any) {
    return this.takeoffsService.update(id, updateTakeoffDto);
  }

  @Delete(':id')
  async deleteTakeoff(@Param('id') id: string) {
    return this.takeoffsService.remove(id);
  }

  // Gestion des items du takeoff
  @Post(':id/items')
  async addTakeoffItem(@Param('id') takeoffId: string, @Body() itemDto: any) {
    return this.takeoffsService.addItem(takeoffId, itemDto);
  }

  @Put(':id/items/:itemId')
  async updateTakeoffItem(
    @Param('id') takeoffId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: any,
  ) {
    return this.takeoffsService.updateItem(itemId, updateDto);
  }

  @Delete(':id/items/:itemId')
  async removeTakeoffItem(@Param('itemId') itemId: string) {
    return this.takeoffsService.removeItem(itemId);
  }

  @Get(':id/items')
  async getTakeoffItems(@Param('id') takeoffId: string) {
    return this.takeoffsService.getItems(takeoffId);
  }

  @Post(':id/calculate-totals')
  async calculateTotals(@Param('id') takeoffId: string) {
    return this.takeoffsService.calculateTotals(takeoffId);
  }
}
