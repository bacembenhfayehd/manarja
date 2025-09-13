import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchDocumentsDto } from '../dto/search-documents.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('documents')
  async searchDocuments(
    @Query() searchDto: SearchDocumentsDto,
    @CurrentUser('id') userId: string
  ) {
    return this.searchService.searchDocuments(searchDto, userId);
  }

  @Get('suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @CurrentUser('id') userId: string
  ) {
    return this.searchService.getSearchSuggestions(query, userId);
  }

  @Get('history')
  async getSearchHistory(@CurrentUser('id') userId: string) {
    return this.searchService.getSearchHistory(userId);
  }
}
