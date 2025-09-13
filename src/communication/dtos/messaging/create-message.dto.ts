
export class CreateMessageDto {
  threadId?: string; 
  content: string;
  senderId: string;
  recipientIds: string[];
  subject?: string; 
  attachments?: Array<{
    url: string;
    type: 'image' | 'video' | 'document' | 'other';
  }>;
}