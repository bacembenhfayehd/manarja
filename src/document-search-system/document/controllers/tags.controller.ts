import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { TagsService } from '../services/tags.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { AssignTagsDto } from '../dto/assign-tags.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  async create(@Body() createTagDto: CreateTagDto, @CurrentUser('id') userId: string) {
    return this.tagsService.create(createTagDto, userId);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.tagsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTagDto: CreateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post('assign')
  async assignTags(@Body() assignTagsDto: AssignTagsDto, @CurrentUser('id') userId: string) {
    return this.tagsService.assignTags(assignTagsDto, userId);
  }

  @Delete('assign/:documentId/:tagId')
  async removeTags(
    @Param('documentId') documentId: string,
    @Param('tagId') tagId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.tagsService.removeTag(documentId, tagId, userId);
  }
}
