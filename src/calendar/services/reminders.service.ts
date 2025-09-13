import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { ReminderType } from '@prisma/client';
import { CronJob } from 'cron';


@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async createReminder(userId: string, dto: CreateReminderDto) {
    const reminder = await this.prisma.reminder.create({
      data: {
        ...dto,
        userId,
      },
    });

    this.scheduleReminder(reminder);
    return reminder;
  }

  async updateReminder(id: string, userId: string, dto: UpdateReminderDto) {
    const reminder = await this.prisma.reminder.update({
      where: { id, userId },
      data: dto,
    });

    this.rescheduleReminder(reminder);
    return reminder;
  }

  async deleteReminder(id: string, userId: string) {
    try {
      this.schedulerRegistry.deleteCronJob(`reminder-${id}`);
    } catch (e) {
      console.warn(`No cron job found for reminder ${id}`);
    }

    return this.prisma.reminder.delete({
      where: { id, userId },
    });
  }

  private scheduleReminder(reminder: {
  id: string;
  triggerAt: Date;
  type: ReminderType;
  eventId: string;
}) {
  try {
    
    if (reminder.triggerAt <= new Date()) {
      throw new Error(`Cannot schedule reminder for past date: ${reminder.triggerAt}`);
    }

    const job = new CronJob(
      reminder.triggerAt,
      async () => {
        try {
          await this.triggerReminder(reminder);
        } catch (error) {
          console.error(`Failed to trigger reminder ${reminder.id}:`, error);
          
        }
      },
      null, 
      false, // start job immediately (we'll start manually)
      'UTC' // timezone
    );

    const jobName = `reminder-${reminder.id}`;
    
    
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();

    console.log(`Reminder scheduled: ${jobName} for ${reminder.triggerAt}`);
  } catch (error) {
    console.error(`Failed to schedule reminder ${reminder.id}:`, error);
    throw error;
  }
}

  private rescheduleReminder(reminder: {
    id: string;
    triggerAt: Date;
    type: ReminderType;
    eventId: string;
  }) {
    try {
      this.schedulerRegistry.deleteCronJob(`reminder-${reminder.id}`);
    } catch (e) {
      console.warn(`No cron job found for reminder ${reminder.id}`);
    }
    this.scheduleReminder(reminder);
  }

  private async triggerReminder(reminder: {
    id: string;
    type: ReminderType;
    eventId: string;
  }) {
   
    console.log(`Triggering reminder ${reminder.id} of type ${reminder.type}`);

    
    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { isTriggered: true },
    });
  }

  async getEventReminders(eventId: string) {
    return this.prisma.reminder.findMany({
      where: { eventId },
      orderBy: { triggerAt: 'asc' },
    });
  }
}