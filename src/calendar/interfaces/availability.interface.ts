import { RecurrenceFrequency } from "@prisma/client";


export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  occurrences?: number;
  byWeekDay?: number[];
  byMonthDay?: number[];
  exceptions?: Date[];
}

export interface AvailabilityCheck {
  resourceId: string;
  startTime: Date;
  endTime: Date;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  conflicts?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
}