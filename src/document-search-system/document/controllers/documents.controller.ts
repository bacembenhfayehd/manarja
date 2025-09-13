import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, UploadedFile, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from '../services/documents.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser('id') userId: string
  ) {
    return this.documentsService.uploadDocument(file, createDocumentDto, userId);
  }

  @Get()
  async findAll(
    @Query() filterDto: DocumentFilterDto,
    @CurrentUser('id') userId: string
  ) {
    return this.documentsService.findAll(filterDto, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentsService.findOne(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser('id') userId: string
  ) {
    return this.documentsService.update(id, updateDocumentDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentsService.remove(id, userId);
  }

  @Get(':id/download')
  async downloadDocument(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.documentsService.getDownloadUrl(id, userId);
  }
}