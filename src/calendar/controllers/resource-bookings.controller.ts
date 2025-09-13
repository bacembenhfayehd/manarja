import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';


import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { User } from '@prisma/client';
import { ResourceBookingsService } from '../services/resource-bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';
import { UpdateBookingDto } from '../dto/update-booking.dto';

@Controller('calendar/bookings')
@UseGuards(JwtAuthGuard)
export class ResourceBookingsController {
  constructor(private readonly bookingsService: ResourceBookingsService) {}

  @Post()
  createBooking(
    @CurrentUser() user: User,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Put(':id')
  updateBooking(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(id, user.id, dto);
  }

  @Delete(':id')
  cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancelBooking(id, user.id);
  }

  @Get('resource/:resourceId')
  getResourceBookings(
    @Param('resourceId') resourceId: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.bookingsService.getResourceBookings(
      resourceId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('availability/:resourceId')
  checkAvailability(
    @Param('resourceId') resourceId: string,
    @Query('start') startTime: string,
    @Query('end') endTime: string,
  ) {
    return this.bookingsService.checkResourceAvailability(
      resourceId,
      new Date(startTime),
      new Date(endTime),
    );
  }
}