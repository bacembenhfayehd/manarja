import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PurchaseRequisitionsService } from '../services/purchase-requisitions.service';

@Controller('inventory/purchase-requisitions')
export class PurchaseRequisitionsController {
  constructor(private readonly requisitionsService: PurchaseRequisitionsService) {}

  @Get()
  async getRequisitions(
    @Query('companyId') companyId: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.requisitionsService.findAll(companyId, { projectId, status, page, limit });
  }

  @Get(':id')
  async getRequisition(@Param('id') id: string) {
    return this.requisitionsService.findOne(id);
  }

  @Post()
  async createRequisition(@Body() createDto: any) {
    return this.requisitionsService.create(createDto);
  }

  @Put(':id')
  async updateRequisition(@Param('id') id: string, @Body() updateDto: any) {
    return this.requisitionsService.update(id, updateDto);
  }

  @Delete(':id')
  async deleteRequisition(@Param('id') id: string) {
    return this.requisitionsService.remove(id);
  }

  // Conversion depuis takeoff
  @Post('from-takeoff/:takeoffId')
  async createFromTakeoff(
    @Param('takeoffId') takeoffId: string,
    @Body() conversionDto: any,
  ) {
    return this.requisitionsService.createFromTakeoff(takeoffId, conversionDto);
  }

  // Gestion des items
  @Post(':id/items')
  async addRequisitionItem(@Param('id') requisitionId: string, @Body() itemDto: any) {
    return this.requisitionsService.addItem(requisitionId, itemDto);
  }

  @Put(':id/items/:itemId')
  async updateRequisitionItem(
    @Param('itemId') itemId: string,
    @Body() updateDto: any,
  ) {
    return this.requisitionsService.updateItem(itemId, updateDto);
  }

  @Delete(':id/items/:itemId')
  async removeRequisitionItem(@Param('itemId') itemId: string) {
    return this.requisitionsService.removeItem(itemId);
  }

  // Workflow de validation
  @Post(':id/submit')
  async submitRequisition(@Param('id') id: string, @Body() submitDto: any) {
    return this.requisitionsService.submit(id, submitDto.requestedBy);
  }

  @Post(':id/approve')
  async approveRequisition(@Param('id') id: string, @Body() approveDto: any) {
    return this.requisitionsService.approve(id, approveDto.approvedBy);
  }

  @Post(':id/reject')
  async rejectRequisition(@Param('id') id: string, @Body() rejectDto: any) {
    return this.requisitionsService.reject(id, rejectDto.rejectedBy, rejectDto.reason);
  }

  @Get(':id/suggested-vendors')
  async getSuggestedVendors(@Param('id') requisitionId: string) {
    return this.requisitionsService.getSuggestedVendors(requisitionId);
  }
}
