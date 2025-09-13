
export class CreateMeetingDto {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participants: string[]; // User IDs
  location?: string;
  videoConferenceLink?: string;
  organizerId: string;
}