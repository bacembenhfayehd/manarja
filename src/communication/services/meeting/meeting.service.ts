import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

  async createMeeting(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    organizerId: string;
    participantIds: string[];
    projectId: string;
    location?: string;
  }) {
    return this.prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        organizerId: data.organizerId,
        projectId: data.projectId,
        location: data.location,
        participants: {
          create: data.participantIds.map((userId) => ({
            userId,
            status: 'PENDING',
            role: 'ATTENDEE',
          })),
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserMeetings(userId: string, startDate?: Date, endDate?: Date) {
    const where = {
      OR: [{ organizerId: userId }, { participants: { some: { userId } } }],
      ...(startDate &&
        endDate && {
          startTime: { gte: startDate, lte: endDate },
        }),
    };

    return this.prisma.meeting.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        project: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, firstName: true } },
          },
        },
      },
    });
  }

  async respondToInvitation(
    meetingId: string,
    userId: string,
    response: 'ACCEPTED' | 'DECLINED',
  ) {
    return this.prisma.meetingParticipant.update({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
      data: {
        status: response,
        respondedAt: new Date(),
      },
    });
  }
}
