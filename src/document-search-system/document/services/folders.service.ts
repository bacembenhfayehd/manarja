import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFolderDto } from '../dto/create-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(createFolderDto: CreateFolderDto, userId: string) {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        createdBy: userId,
      },
      include: {
        parent: true,
        _count: { select: { children: true, documents: true } }
      }
    });
  }

  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { createdBy: userId },
      include: {
        parent: true,
        _count: { select: { children: true, documents: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        documents: {
          include: {
            uploadedByUser: { select: { firstName: true, lastName: true } }
          }
        },
        _count: { select: { children: true, documents: true } }
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async getFolderTree(rootId?: string) {
    const folders = await this.prisma.folder.findMany({
      where: rootId ? { parentId: rootId } : { parentId: null },
      include: {
        children: {
          include: {
            _count: { select: { children: true, documents: true } }
          }
        },
        _count: { select: { children: true, documents: true } }
      },
      orderBy: { name: 'asc' }
    });

    return folders;
  }

  async update(id: string, updateFolderDto: CreateFolderDto) {
    return this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
      include: {
        parent: true,
        _count: { select: { children: true, documents: true } }
      }
    });
  }

  async remove(id: string, userId: string) {
    
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        documents: true,
      }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.children.length > 0 || folder.documents.length > 0) {
      throw new Error('Cannot delete folder with children or documents');
    }

    await this.prisma.folder.delete({ where: { id } });

    return { message: 'Folder deleted successfully' };
  }
}