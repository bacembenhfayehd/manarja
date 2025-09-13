import { Module } from '@nestjs/common';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PipelineController],
  providers: [PipelineService, PrismaService],
})
export class PipelineModule {}