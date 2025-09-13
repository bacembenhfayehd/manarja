import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { FoldersService } from '../services/folders.service';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async create(@Body() createFolderDto: CreateFolderDto, @CurrentUser('id') userId: string) {
    return this.foldersService.create(createFolderDto, userId);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.foldersService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Get(':id/tree')
  async getFolderTree(@Param('id') id: string) {
    return this.foldersService.getFolderTree(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFolderDto: CreateFolderDto) {
    return this.foldersService.update(id, updateFolderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.foldersService.remove(id, userId);
  }
}
