import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentFilterDto } from '../dto/document-filter.dto';
import { DocumentIndexingService } from './document-indexing.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private documentIndexing: DocumentIndexingService
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    userId: string
  ) {
   
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join('uploads/documents', filename);
    
    await fs.writeFile(filePath, file.buffer);

   
    const document = await this.prisma.document.create({
      data: {
        filename: file.originalname,
        filePath,
        mimeType: file.mimetype,
        fileSize: file.size,
        projectId: createDocumentDto.projectId,
        documentType: createDocumentDto.documentType,
        description: createDocumentDto.description,
        uploadedBy: userId,
        folderId: createDocumentDto.folderId,
      },
      include: {
        project: true,
        uploadedByUser: { select: { id: true, firstName: true, lastName: true } },
        folder: true,
      }
    });

  
    await this.documentIndexing.indexDocument(document.id, file.buffer, file.mimetype);

   
    await this.logActivity(document.id, userId, 'created');

    return document;
  }

  async findAll(filterDto: DocumentFilterDto, userId: string) {
    const where: any = {};

    if (filterDto.projectId) where.projectId = filterDto.projectId;
    if (filterDto.folderId) where.folderId = filterDto.folderId;
    if (filterDto.documentType) where.documentType = filterDto.documentType;
    if (filterDto.mimeType) where.mimeType = { contains: filterDto.mimeType };

    return this.prisma.document.findMany({
      where,
      include: {
        uploadedByUser: { select: { firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filterDto.limit || 50,
      skip: filterDto.offset || 0,
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploadedByUser: { select: { firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        folder: true,
        project: true,
      }
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.logActivity(id, userId, 'viewed');

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, userId: string) {
    const document = await this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        uploadedByUser: { select: { firstName: true, lastName: true } },
        tags: { include: { tag: true } },
      }
    });

    await this.logActivity(id, userId, 'updated', updateDocumentDto);

    return document;
  }

  async remove(id: string, userId: string) {
    const document = await this.findOne(id, userId);
    
    
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

   
    await this.prisma.document.delete({ where: { id } });

    await this.logActivity(id, userId, 'deleted');

    return { message: 'Document deleted successfully' };
  }

  async getDownloadUrl(id: string, userId: string) {
    const document = await this.findOne(id, userId);
    
    await this.logActivity(id, userId, 'downloaded');

    return {
      downloadUrl: `/files/${path.basename(document.filePath)}`,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  private async logActivity(documentId: string, userId: string, action: string, metadata?: any) {
    await this.prisma.documentActivity.create({
      data: {
        documentId,
        userId,
        action,
        metadata,
      }
    });
  }
}