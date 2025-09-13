
export class AvailabilityDto {
  userId: string;
  date: Date;
  timezone: string;
}

export class AvailabilityResponseDto {
  availableSlots: {
    start: Date;
    end: Date;
  }[];
}