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
import { EstimatesService } from './estimates.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';


@Controller('estimates')
@UseGuards(JwtAuthGuard)
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  create(@Request() req, @Body() createEstimateDto: CreateEstimateDto) {
    return this.estimatesService.create(req.user.id, createEstimateDto);
  }

  @Get()
  findAll(@Request() req, @Query('projectId') projectId?: string) {
    return this.estimatesService.findAll(req.user.id, projectId);
  }

  @Get('stats')
  getStats(@Request() req, @Query('projectId') projectId?: string) {
    return this.estimatesService.getEstimateStats(req.user.id, projectId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.estimatesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateEstimateDto: UpdateEstimateDto
  ) {
    return this.estimatesService.update(id, req.user.id, updateEstimateDto);
  }

  @Post(':id/send')
  sendToClient(@Request() req, @Param('id') id: string) {
    return this.estimatesService.sendToClient(id, req.user.id);
  }

  @Post(':id/approve')
  approve(@Request() req, @Param('id') id: string) {
    return this.estimatesService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  reject(@Request() req, @Param('id') id: string) {
    return this.estimatesService.reject(id, req.user.id);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req, @Param('id') id: string) {
    return this.estimatesService.duplicate(id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.estimatesService.remove(id, req.user.id);
  }
}
