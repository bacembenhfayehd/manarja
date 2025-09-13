import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProjectTemplatesService } from '../services/project-templates.service';
import { CreateProjectTemplateDto } from '../dto/template/create-project-template.dto';
import { UpdateProjectTemplateDto } from '../dto/template/update-project-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectType } from '@prisma/client';

@Controller('project-templates')
@UseGuards(JwtAuthGuard)
export class ProjectTemplatesController {
  constructor(
    private readonly projectTemplatesService: ProjectTemplatesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProjectTemplateDto: CreateProjectTemplateDto,
    @Request() req,
  ) {
    return this.projectTemplatesService.create(
      createProjectTemplateDto,
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Query('type') type?: ProjectType,
    @Query('companyId') companyId?: string,
    @Query('isPublic') isPublic?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Request() req?,
  ) {
    const filters = {
      type,
      companyId,
      isPublic: isPublic !== undefined ? isPublic : undefined,
      userId: req.user.id,
      search,
    };

    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    };

    return this.projectTemplatesService.findAll(filters, pagination);
  }

  @Get('public')
  async findPublicTemplates(
    @Query('type') type?: ProjectType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = { type, isPublic: true };
    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    };

    return this.projectTemplatesService.findPublicTemplates(
      filters,
      pagination,
    );
  }

  @Get('my-templates')
  async findMyTemplates(@Request() req) {
    return this.projectTemplatesService.findUserTemplates(req.user.id);
  }

  @Get('company/:companyId')
  async findCompanyTemplates(
    @Param('companyId') companyId: string,
    @Request() req,
  ) {
    return this.projectTemplatesService.findCompanyTemplates(
      companyId,
      req.user.id,
    );
  }

  @Get('by-type/:type')
  async findByType(
    @Param('type') type: ProjectType,
    @Query('companyId') companyId?: string,
    @Request() req?,
  ) {
    return this.projectTemplatesService.findByType(
      type,
      companyId,
      req.user.id,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.findOne(id, req.user.id);
  }

  @Get(':id/preview')
  async getTemplatePreview(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.getTemplatePreview(id, req.user.id);
  }

  @Get(':id/phases')
  async getTemplatePhases(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.getTemplatePhases(id, req.user.id);
  }

  @Get(':id/tasks')
  async getTemplateTasks(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.getTemplateTasks(id, req.user.id);
  }

  @Post(':id/use')
  async useTemplate(
    @Param('id') id: string,
    @Body('projectData') projectData: any,
    @Request() req,
  ) {
    return this.projectTemplatesService.createProjectFromTemplate(
      id,
      projectData,
      req.user.id,
    );
  }

  @Post(':id/duplicate')
  async duplicateTemplate(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.duplicateTemplate(id, req.user.id);
  }

  @Post('from-project/:projectId')
  async createFromProject(
    @Param('projectId') projectId: string,
    @Body('templateData') templateData: CreateProjectTemplateDto,
    @Request() req,
  ) {
    return this.projectTemplatesService.createFromProject(
      projectId,
      templateData,
      req.user.id,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectTemplateDto: UpdateProjectTemplateDto,
    @Request() req,
  ) {
    return this.projectTemplatesService.update(
      id,
      updateProjectTemplateDto,
      req.user.id,
    );
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.publish(id, req.user.id);
  }

  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.unpublish(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.projectTemplatesService.remove(id, req.user.id);
  }

  @Get('stats/usage')
  async getUsageStats(@Query('templateId') templateId?: string) {
    return this.projectTemplatesService.getUsageStats(templateId);
  }
}