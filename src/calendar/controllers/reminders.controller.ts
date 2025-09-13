import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';


import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { User } from '@prisma/client';
import { RemindersService } from '../services/reminders.service';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';

@Controller('calendar/reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  createReminder(
    @CurrentUser() user: User,
    @Body() dto: CreateReminderDto,
  ) {
    return this.remindersService.createReminder(user.id, dto);
  }

  @Put(':id')
  updateReminder(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.updateReminder(id, user.id, dto);
  }

  @Delete(':id')
  deleteReminder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.remindersService.deleteReminder(id, user.id);
  }

  @Get('event/:eventId')
  getEventReminders(@Param('eventId') eventId: string) {
    return this.remindersService.getEventReminders(eventId);
  }
}