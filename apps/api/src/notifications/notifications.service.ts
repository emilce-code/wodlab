import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

type NotificationItem = {
  key: string;
  type: 'UPCOMING_WORKOUT' | 'OVERDUE_WORKOUT' | 'COACH_INVITATION';
  occurredAt: Date;
  href: string;
  data: Record<string, string>;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async findAll(userId: string) {
    const preferences = await this.getPreferences(userId);
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    const items: NotificationItem[] = [];

    if (athlete && preferences.workoutReminders) {
      const today = this.startOfUtcDay(new Date());
      const through = new Date(today);
      through.setUTCDate(through.getUTCDate() + preferences.reminderLeadDays);
      const scheduled = await this.prisma.scheduledWorkout.findMany({
        where: {
          athleteProfileId: athlete.id,
          status: 'PLANNED',
          scheduledDate: { lte: through },
        },
        select: {
          id: true,
          scheduledDate: true,
          workout: { select: { id: true, name: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      });

      for (const entry of scheduled) {
        const overdue = entry.scheduledDate < today;
        items.push({
          key: `${overdue ? 'overdue' : 'upcoming'}:${entry.id}`,
          type: overdue ? 'OVERDUE_WORKOUT' : 'UPCOMING_WORKOUT',
          occurredAt: entry.scheduledDate,
          href: `/workouts/${entry.workout.id}?scheduledWorkoutId=${entry.id}`,
          data: {
            workoutName: entry.workout.name,
            scheduledDate: entry.scheduledDate.toISOString(),
          },
        });
      }
    }

    if (athlete && preferences.coachUpdates) {
      const invitations = await this.prisma.coachAthleteRelationship.findMany({
        where: { athleteProfileId: athlete.id, status: 'PENDING' },
        select: {
          id: true,
          createdAt: true,
          coachProfile: { select: { displayName: true } },
        },
      });
      for (const invitation of invitations) {
        items.push({
          key: `coach-invitation:${invitation.id}`,
          type: 'COACH_INVITATION',
          occurredAt: invitation.createdAt,
          href: '/coach',
          data: { coachName: invitation.coachProfile.displayName },
        });
      }
    }

    const receipts = await this.prisma.notificationReceipt.findMany({
      where: { userId, notificationKey: { in: items.map((item) => item.key) } },
    });
    const receiptByKey = new Map(
      receipts.map((receipt) => [receipt.notificationKey, receipt]),
    );
    const notifications = items
      .filter((item) => !receiptByKey.get(item.key)?.dismissedAt)
      .map((item) => ({
        ...item,
        read: Boolean(receiptByKey.get(item.key)?.readAt),
      }))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return {
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      preferences,
    };
  }

  markRead(userId: string, notificationKey: string) {
    return this.prisma.notificationReceipt.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { readAt: new Date() },
      create: { userId, notificationKey, readAt: new Date() },
    });
  }

  async readAll(userId: string) {
    const { notifications } = await this.findAll(userId);
    await this.prisma.$transaction(
      notifications
        .filter((item) => !item.read)
        .map((item) =>
          this.prisma.notificationReceipt.upsert({
            where: {
              userId_notificationKey: { userId, notificationKey: item.key },
            },
            update: { readAt: new Date() },
            create: { userId, notificationKey: item.key, readAt: new Date() },
          }),
        ),
    );
    return { success: true };
  }

  dismiss(userId: string, notificationKey: string) {
    return this.prisma.notificationReceipt.upsert({
      where: { userId_notificationKey: { userId, notificationKey } },
      update: { dismissedAt: new Date() },
      create: { userId, notificationKey, dismissedAt: new Date() },
    });
  }

  private startOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
}
