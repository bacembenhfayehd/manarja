import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentIndexingService {
  constructor(private prisma: PrismaService) {}

  async indexDocument(documentId: string, fileBuffer: Buffer, mimeType: string) {
    let content = '';
    let tokens: string[] = [];

    try {
      
      if (mimeType === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        content = data.text;
      } else if (mimeType.startsWith('text/')) {
        content = fileBuffer.toString('utf8');
      }

      
      tokens = this.tokenizeContent(content);

      
      await this.prisma.searchIndex.upsert({
        where: { documentId },
        create: {
          documentId,
          content,
          tokens,
        },
        update: {
          content,
          tokens,
        }
      });

    } catch (error) {
      console.error('Error indexing document:', error);
    }
  }

  private tokenizeContent(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .slice(0, 1000); 
  }

  async reindexDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });

    if (document) {
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(document.filePath);
      await this.indexDocument(documentId, fileBuffer, document.mimeType);
    }
  }
}