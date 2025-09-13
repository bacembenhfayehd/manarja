import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MessageAttachmentService {
  constructor(private prisma: PrismaService) {}

  
  async uploadAttachment(data: {
    messageId: string;
    filename: string;
    filesize: number;
    fileUrl: string;
    fileType : string ;
  }) {
    return this.prisma.messageAttachment.create({
      data: {
        messageId: data.messageId,
        filename: data.filename,
        fileSize: data.filesize,
        fileUrl: data.fileUrl,
        fileType:data.fileType
        
      },
    });
  }

  
  async getMessageAttachments(messageId: string) {
    return this.prisma.messageAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
  }

  
  async deleteAttachment(attachmentId: string, userId: string) {
  
  const attachment = await this.prisma.messageAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: {
        select: {
          senderId: true
        }
      }
    }
  });

  if (!attachment) {
    throw new NotFoundException('Attachment not found');
  }

  
  if (attachment.message.senderId !== userId) {
    throw new ForbiddenException('You are not authorized to delete this attachment');
  }

  
  return this.prisma.messageAttachment.delete({
    where: { id: attachmentId },
  });
}

  
  async getAttachmentDetails(attachmentId: string) {
  return this.prisma.messageAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: {
        select: { 
          id: true,
          senderId: true,
          sender: {  
            select: { 
              id: true, 
              firstName: true,  
              profileImage: true 
            }
          }
        },
      },
      
    },
  });
}

 
  async getConversationAttachments(threadId?: string, senderId?: string, receiverId?: string) {
  const where = threadId
    ? {
        message: { 
          threadId,
          
          ...(senderId && { senderId }) 
        }
      }
    : {
        message: {
          
          ...(senderId && receiverId && {
            OR: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          })
        }
      };

  return this.prisma.messageAttachment.findMany({
    where,
    orderBy: { createdAt: 'desc' }, 
    include: {
      message: {
        select: { 
          id: true, 
          senderId: true, 
          createdAt: true, 
          thread: {
            select: {
              id: true,
              title: true
            }
          }
        },
      },
    },
  });
}

 
  validateFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}

