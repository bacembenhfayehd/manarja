
export class UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  participants?: string[];
  location?: string;
  videoConferenceLink?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}