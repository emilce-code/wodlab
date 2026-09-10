export type NotificationPreferences = {
  workoutReminders: boolean;
  coachUpdates: boolean;
  reminderLeadDays: number;
};

export type NotificationItem = {
  key: string;
  type: "UPCOMING_WORKOUT" | "OVERDUE_WORKOUT" | "COACH_INVITATION";
  occurredAt: string;
  href: string;
  data: Record<string, string>;
  read: boolean;
};

export type NotificationResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences;
};
