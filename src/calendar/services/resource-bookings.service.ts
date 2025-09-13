import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';


@Injectable()
export class ResourceBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    
    const isAvailable = await this.checkResourceAvailability(
      dto.resourceId,
      dto.startTime,
      dto.endTime,
    );

    if (!isAvailable) {
      throw new Error('Resource not available for the selected time slot');
    }

    return this.prisma.resourceBooking.create({
      data: {
        ...dto,
        bookedById: userId,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        resource: true,
        event: true,
      },
    });
  }

  async updateBooking(id: string, userId: string, dto: UpdateBookingDto) {
    return this.prisma.resourceBooking.update({
      where: { id, bookedById: userId },
      data: dto,
      include: {
        resource: true,
        event: true,
      },
    });
  }

  async cancelBooking(id: string, userId: string) {
    return this.prisma.resourceBooking.update({
      where: { id, bookedById: userId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  async checkResourceAvailability(
    resourceId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const conflictingBookings = await this.prisma.resourceBooking.count({
      where: {
        resourceId,
        status: { not: BookingStatus.CANCELLED },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    return conflictingBookings === 0;
  }

  async getResourceBookings(resourceId: string, startDate: Date, endDate: Date) {
    return this.prisma.resourceBooking.findMany({
      where: {
        resourceId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        status: { not: BookingStatus.CANCELLED },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}