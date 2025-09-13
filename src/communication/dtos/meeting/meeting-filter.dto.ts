
export class MeetingFilterDto {
  organizerId?: string;
  participantId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}