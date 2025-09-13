
export class MessageFilterDto {
  threadId?: string;
  senderId?: string;
  recipientId?: string;
  searchTerm?: string;
  isArchived?: boolean;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}