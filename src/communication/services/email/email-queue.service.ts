import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailPriority, EmailStatus } from '@prisma/client';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async addEmailToQueue(data: {
    to: string | string[];
    subject: string;
    content: string;
    templateId?: string;
    variables?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
    attempts?: number;
  }) {
    const jobOptions = {
      priority: this.getPriorityValue(data.priority || 'normal'),
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    };

    const emailData = {
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      content: data.content,
      templateId: data.templateId,
      variables: data.variables,
      createdAt: new Date(),
    };

    const job = await this.emailQueue.add('send-email', emailData, jobOptions);

    await this.prisma.emailQueue.create({
      data: {
        to: emailData.to,
        cc: [],
        bcc: [],
        subject: data.subject,
        htmlBody: data.content,
        textBody: data.content,
        priority: this.mapPriorityToEnum(data.priority || 'normal'),
        status: EmailStatus.PENDING,
        attempts: 0,
        maxRetries: data.attempts || 3,
        scheduledAt: data.delay
          ? new Date(Date.now() + data.delay)
          : new Date(),
        metadata: {
          jobId: job.id.toString(),
          templateId: data.templateId,
          variables: data.variables,
        },
      },
    });

    return {
      jobId: job.id,
      status: 'queued',
      scheduledAt: new Date(Date.now() + (data.delay || 0)),
    };
  }

  async addNotificationEmail(data: {
    userId: string;
    type: string;
    subject: string;
    content: string;
    variables?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true, notifications: true },
    });

    if (!user || !user.notifications) {
      return { status: 'skipped', reason: 'Email notifications disabled' };
    }

    return this.addEmailToQueue({
      to: user.email,
      subject: data.subject,
      content: data.content,
      variables: { ...data.variables, userName: user.firstName },
      priority: data.priority,
    });
  }

  async addBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      content: string;
      templateId?: string;
      variables?: Record<string, any>;
    }>,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      batchSize?: number;
      delay?: number;
    },
  ) {
    const batchSize = options?.batchSize || 50;
    const delay = options?.delay || 1000;
    const results = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchJobs = batch.map((email, index) =>
        this.addEmailToQueue({
          ...email,
          priority: options?.priority,
          delay: delay * Math.floor(i / batchSize) + index * 100,
        }),
      );

      const batchResults = await Promise.all(batchJobs);
      results.push(...batchResults);
    }

    return {
      total: emails.length,
      queued: results.length,
      batches: Math.ceil(emails.length / batchSize),
    };
  }

  async addRecurringEmail(data: {
    name: string;
    recipients: string[];
    subject: string;
    content: string;
    templateId?: string;
    variables?: Record<string, any>;
    schedule: string;
    startDate?: Date;
    endDate?: Date;
    createdById: string;
  }) {
    const job = await this.emailQueue.add(
      'send-bulk-email',
      {
        recipients: data.recipients,
        subject: data.subject,
        content: data.content,
        templateId: data.templateId,
        variables: data.variables,
      },
      {
        repeat: {
          cron: data.schedule,
          startDate: data.startDate,
          endDate: data.endDate,
        },
        removeOnComplete: 5,
        removeOnFail: 3,
      },
    );

    await this.prisma.recurringEmail.create({
      data: {
        name: data.name,
        recipients: data.recipients,
        subject: data.subject,
        htmlBody: data.content,
        textBody: data.content,
        schedule: data.schedule,
        isActive: true,
        createdById: data.createdById,
        nextSendAt: new Date(),
      },
    });

    return { jobId: job.id, status: 'scheduled' };
  }

  async getQueueStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total:
        waiting.length +
        active.length +
        completed.length +
        failed.length +
        delayed.length,
    };
  }

  async getEmailHistory(filters?: {
    status?: EmailStatus;
    recipient?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.recipient) {
      where.to = { has: filters.recipient };
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return this.prisma.emailQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async retryFailedEmail(queueId: string) {
    const emailRecord = await this.prisma.emailQueue.findUnique({
      where: { id: queueId },
    });

    if (!emailRecord || emailRecord.status !== EmailStatus.FAILED) {
      throw new Error('Email not found or not in failed status');
    }

    const job = await this.emailQueue.add('send-email', {
      to: emailRecord.to,
      subject: emailRecord.subject,
      content: emailRecord.htmlBody,
    });

    await this.prisma.emailQueue.update({
      where: { id: queueId },
      data: {
        status: EmailStatus.PENDING,
        attempts: 0,
        metadata: {
          ...(emailRecord.metadata as any),
          jobId: job.id.toString(),
        },
      },
    });

    return { jobId: job.id, status: 'retried' };
  }

  async cancelPendingEmail(queueId: string) {
    const emailRecord = await this.prisma.emailQueue.findUnique({
      where: { id: queueId },
    });

    if (!emailRecord) {
      throw new Error('Email not found');
    }

    // Récupérer le jobId depuis les metadata
    const metadata = emailRecord.metadata as any;
    if (metadata?.jobId) {
      const job = await this.emailQueue.getJob(metadata.jobId);
      if (job) {
        await job.remove();
      }
    }

    await this.prisma.emailQueue.delete({
      where: { id: queueId },
    });

    return { status: 'cancelled' };
  }

  async purgeOldEmails(olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deleted = await this.prisma.emailQueue.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: [EmailStatus.SENT, EmailStatus.FAILED] },
      },
    });

    return { deleted: deleted.count };
  }

  async getEmailStats(dateFrom?: Date, dateTo?: Date) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const stats = await this.prisma.emailQueue.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const result = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      retrying: 0,
    };

    stats.forEach((stat) => {
      result.total += stat._count.status;
      switch (stat.status) {
        case EmailStatus.SENT:
          result.sent = stat._count.status;
          break;
        case EmailStatus.FAILED:
          result.failed = stat._count.status;
          break;
        case EmailStatus.PENDING:
          result.pending = stat._count.status;
          break;
        case EmailStatus.RETRYING:
          result.retrying = stat._count.status;
          break;
      }
    });

    return result;
  }

  private getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high':
        return 10;
      case 'normal':
        return 5;
      case 'low':
        return 1;
      default:
        return 5;
    }
  }

  private mapPriorityToEnum(priority: string): EmailPriority {
    switch (priority) {
      case 'high':
        return EmailPriority.HIGH;
      case 'low':
        return EmailPriority.LOW;
      default:
        return EmailPriority.NORMAL;
    }
  }

  async clearQueue() {
    await this.emailQueue.empty();
    return { status: 'queue cleared' };
  }

  async pauseQueue() {
    await this.emailQueue.pause();
    return { status: 'queue paused' };
  }

  async resumeQueue() {
    await this.emailQueue.resume();
    return { status: 'queue resumed' };
  }
}
