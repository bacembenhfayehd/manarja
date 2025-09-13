import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PurchaseOrdersService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';


@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(@Request() req, @Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(req.user.id, createPurchaseOrderDto);
  }

  @Post('from-estimate/:estimateId')
  createFromEstimate(
    @Request() req,
    @Param('estimateId') estimateId: string,
    @Body('vendorId') vendorId: string
  ) {
    return this.purchaseOrdersService.createFromEstimate(req.user.id, estimateId, vendorId);
  }

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    return this.purchaseOrdersService.findAll(req.user.id, projectId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto
  ) {
    return this.purchaseOrdersService.update(id, req.user.id, updatePurchaseOrderDto);
  }

  @Post(':id/send')
  sendToVendor(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.sendToVendor(id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.purchaseOrdersService.remove(id, req.user.id);
  }
}