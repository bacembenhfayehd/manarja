import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CalendarEventsController } from './controllers/calendar-events.controller';
import { ResourceBookingsController } from './controllers/resource-bookings.controller';
import { RemindersController } from './controllers/reminders.controller';
import { CalendarEventsService } from './services/calendar-events.service';
import { ResourceBookingsService } from './services/resource-bookings.service';
import { RemindersService } from './services/reminders.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    PrismaModule,             
    AuthModule,               
  ],
  controllers: [
    CalendarEventsController,
    ResourceBookingsController,
    RemindersController,
  ],
  providers: [
    CalendarEventsService,
    ResourceBookingsService,
    RemindersService,
  ],
  exports: [
    CalendarEventsService,
  ],
})
export class CalendarModule {}