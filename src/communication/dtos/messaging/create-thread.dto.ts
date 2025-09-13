
export class CreateThreadDto {
  subject: string;
  initialMessage: {
    content: string;
    senderId: string;
  };
  participantIds: string[];
}