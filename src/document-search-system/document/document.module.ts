import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DocumentsController } from './controllers/documents.controller';
import { FoldersController } from './controllers/folder.controllers';
import { SearchController } from './controllers/search.controller';
import { TagsController } from './controllers/tags.controller';
import { DocumentIndexingService } from './services/document-indexing.service';
import { DocumentsService } from './services/document.service';
import { FoldersService } from './services/folders.service';
import { SearchService } from './services/search.service';
import { TagsService } from './services/tags.service';

@Module({
    imports:[PrismaModule],
    controllers:[DocumentsController,FoldersController,SearchController,TagsController,],
    providers:[DocumentIndexingService,DocumentsService,FoldersService,SearchService,TagsService],
    exports:[DocumentIndexingService,DocumentsService,FoldersService,SearchService,TagsService]
})
export class DocumentSearchSystemModule {}
