import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company successfully created' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    return this.companyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company information' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company (soft delete)' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }

  // Branding endpoints
  @Get(':id/branding')
  @ApiOperation({ summary: 'Get company branding' })
  getBranding(@Param('id') companyId: string) {
    return this.companyService.getBranding(companyId);
  }

  @Patch(':id/branding')
  @ApiOperation({ summary: 'Update company branding' })
  updateBranding(@Param('id') companyId: string, @Body() brandingData: any) {
    return this.companyService.updateBranding(companyId, brandingData);
  }
}