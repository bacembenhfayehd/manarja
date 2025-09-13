
export class ChatEventDto {
  eventType: 'typing' | 'online' | 'offline' | 'read_receipt';
  userId: string;
  roomId?: string;
  messageId?: string; // For read receipts
}