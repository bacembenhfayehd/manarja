import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchDocumentsDto } from '../dto/search-documents.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchDocuments(searchDto: SearchDocumentsDto, userId: string) {
    const { query, tags, folderId, documentType, limit = 50, offset = 0 } = searchDto;

    const where: any = {};

    
    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          searchIndexes: {
            some: {
              content: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    
    if (tags?.length > 0) {
      where.tags = {
        some: {
          tag: { name: { in: tags } }
        }
      };
    }

    if (folderId) where.folderId = folderId;
    if (documentType) where.documentType = documentType;

    const results = await this.prisma.document.findMany({
      where,
      include: {
        uploadedByUser: { select: { firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

   
    await this.logSearch(userId, query, results.length);

    return {
      results,
      count: results.length,
      query,
    };
  }

  async getSearchSuggestions(query: string, userId: string) {
    if (!query || query.length < 2) return [];

    const [documents, tags] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          OR: [
            { filename: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        select: { filename: true, description: true },
        take: 5,
      }),
      this.prisma.tag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        select: { name: true },
        take: 5,
      })
    ]);

    return {
      documents: documents.map(d => d.filename),
      tags: tags.map(t => t.name),
    };
  }

  async getSearchHistory(userId: string) {
    const activities = await this.prisma.documentActivity.findMany({
      where: {
        userId,
        action: 'searched',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        metadata: true,
        createdAt: true,
      }
    });

    return activities.map(activity => ({
      query: activity.metadata?.query,
      date: activity.createdAt,
      resultsCount: activity.metadata?.resultsCount,
    }));
  }

  private async logSearch(userId: string, query: string, resultsCount: number) {
    await this.prisma.documentActivity.create({
      data: {
        documentId: null, 
        userId,
        action: 'searched',
        metadata: { query, resultsCount },
      }
    });
  }
}
