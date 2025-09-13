import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

 
  async checkAvailability(userId: string, startTime: Date, endTime: Date) {
    const conflicts = await this.prisma.meeting.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { participants: { some: { userId, status: 'ACCEPTED' } } },
        ],
        status: { not: 'CANCELLED' },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    return {
      available: conflicts.length === 0,
      conflicts: conflicts,
    };
  }

  
  async suggestTimeSlots(userIds: string[], date: Date, duration: number) {
    const suggestions = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); 
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0);

   
    for (let time = new Date(startOfDay); time < endOfDay; time.setMinutes(time.getMinutes() + 30)) {
      const slotEnd = new Date(time.getTime() + duration * 60000);
      
      let allAvailable = true;
      for (const userId of userIds) {
        const availability = await this.checkAvailability(userId, time, slotEnd);
        if (!availability.available) {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        suggestions.push({
          startTime: new Date(time),
          endTime: new Date(slotEnd),
        });
      }
    }

    return suggestions.slice(0, 5);
  }
}