import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { DocumentSharesService } from '../services/document-shares.service';
import { ShareDocumentDto } from '../dto';

@Controller('document-shares')
@UseGuards(JwtAuthGuard)
export class DocumentSharesController {
  constructor(private sharesService: DocumentSharesService) {}

  @Post()
  async shareDocument(
    @Body() dto: ShareDocumentDto,
    @CurrentUser('id') userId: string
  ) {
    return this.sharesService.shareDocument(dto, userId);
  }

  @Get('my-documents')
  async getSharedDocuments(@CurrentUser('id') userId: string) {
    return this.sharesService.getSharedDocuments(userId);
  }
}