
export class NotificationSettingsDto {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  meetingReminders: boolean;
  messageAlerts: boolean;
}