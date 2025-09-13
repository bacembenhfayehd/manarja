import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { BrandingService } from './branding.service';

@Module({
    controllers:[BrandingController],
    providers:[BrandingService,PrismaService],
    exports:[BrandingService]
})
export class BrandingModule {}
