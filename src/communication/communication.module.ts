import { EmailService } from "src/email/email.service";
import { AvailabilityService } from "./services/meeting/availability.service";
import { CalendarService } from "./services/meeting/calendar.service";
import { MeetingReminderService } from "./services/meeting/meeting-reminder.service";
import { MeetingService } from "./services/meeting/meeting.service";
import { MessagingService } from "./services/messaging/messaging.service";
import { ChatService } from "./services/chat/chat.service";
import { RoomService } from "./services/chat/room.service";
import { PresenceService } from "./services/chat/presence.service";
import { NotificationService } from "./services/email/notification.service";
import { EmailQueueService } from "./services/email/email-queue.service";
import { ThreadService } from "./services/messaging/thread.service";
import { MessageAttachmentService } from "./services/messaging/message-attachment.service";
import { MessagingController } from "./controllers/messaging.controller";
import { EmailController } from "./controllers/email.controller";
import { ChatController } from "./controllers/chat.controller";
import { MeetingController } from "./controllers/meeting.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ChatGateway } from "./gateways/chat.gateway";

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    //other imports...
  ],
  controllers: [
    MessagingController,
    EmailController,
    ChatController,
    MeetingController,
  ],
  providers: [
    // Messaging
    MessagingService,
    ThreadService,
    MessageAttachmentService,
    
    // Email
    EmailService,
    NotificationService,
    EmailQueueService,
    
    // Chat
    ChatGateway,
    ChatService,
    RoomService,
    PresenceService,
    
    // Meeting
    MeetingService,
    CalendarService,
    AvailabilityService,
    MeetingReminderService,
  ],
  exports: [
    MessagingService,
    EmailService,
    ChatService,
    MeetingService,
  ],
})
export class CommunicationModule {}