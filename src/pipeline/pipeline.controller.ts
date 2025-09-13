import { Controller, Get, Query } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineFilterDto } from './dto/pipeline-filter.dto';

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('overview')
  async getOverview(@Query() filters: PipelineFilterDto) {
    return this.pipelineService.getOverview(filters);
  }

  @Get('stats')
  async getStats(@Query() filters: PipelineFilterDto) {
    return this.pipelineService.getStats(filters);
  }

  @Get('conversion')
  async getConversion(@Query() filters: PipelineFilterDto) {
    return this.pipelineService.getConversion(filters);
  }
}
