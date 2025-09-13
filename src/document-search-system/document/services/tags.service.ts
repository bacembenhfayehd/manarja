import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { AssignTagsDto } from '../dto/assign-tags.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto, userId: string) {
    return this.prisma.tag.create({
      data: {
        ...createTagDto,
        createdBy: userId,
      }
    });
  }

  async findAll(userId?: string) {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { documents: true } },
      }
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        documents: {
          include: { document: true }
        }
      }
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, updateTagDto: CreateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(id: string) {
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag deleted successfully' };
  }

  async assignTags(assignTagsDto: AssignTagsDto, userId: string) {
    const { documentId, tagIds } = assignTagsDto;

   
    await this.prisma.documentTag.deleteMany({
      where: { documentId }
    });

    
    const documentTags = await Promise.all(
      tagIds.map(tagId =>
        this.prisma.documentTag.create({
          data: {
            documentId,
            tagId,
            assignedBy: userId,
          },
          include: { tag: true }
        })
      )
    );

    return documentTags;
  }

  async removeTag(documentId: string, tagId: string, userId: string) {
    await this.prisma.documentTag.deleteMany({
      where: { documentId, tagId }
    });

    return { message: 'Tag removed from document' };
  }
}