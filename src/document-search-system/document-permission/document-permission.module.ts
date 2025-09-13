import { Module } from '@nestjs/common';
import { DocumentPermissionsController } from './controllers/document-permissions.controller';
import { DocumentSharesController } from './controllers/document-shares.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DocumentPermissionsService } from './services/document-permission.service';
import { DocumentSharesService } from './services/document-shares.service';
import { DocumentPermissionGuard } from './guards/guards/document-permission.guard';


@Module({
  imports: [PrismaModule],
  controllers: [
    DocumentPermissionsController,
    DocumentSharesController
  ],
  providers: [
    DocumentPermissionsService,
    DocumentSharesService,
    DocumentPermissionGuard
  ],
  exports: [
    DocumentPermissionsService,
    DocumentSharesService,
    DocumentPermissionGuard
  ]
})
export class DocumentPermissionsModule {}