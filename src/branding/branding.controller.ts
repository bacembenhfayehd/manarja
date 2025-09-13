import { Controller, Get, Patch, UploadedFile, UseInterceptors, Param, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Company Branding')
@Controller('companies/:companyId/branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  @ApiOperation({ summary: 'Get company branding' })
  @ApiResponse({ status: 200, description: 'Branding data retrieved successfully' })
  getBranding(@Param('companyId') companyId: string) {
    return this.brandingService.getBranding(companyId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update company branding' })
  @ApiResponse({ status: 200, description: 'Branding updated successfully' })
  updateBranding(
    @Param('companyId') companyId: string,
    @Body() updateBrandingDto: UpdateBrandingDto
  ) {
    return this.brandingService.updateBranding(companyId, updateBrandingDto);
  }

  @Patch('logo')
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.brandingService.uploadLogo(companyId, file);
  }

  @Patch('favicon')
  @ApiOperation({ summary: 'Upload company favicon' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFavicon(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.brandingService.uploadFavicon(companyId, file);
  }
}