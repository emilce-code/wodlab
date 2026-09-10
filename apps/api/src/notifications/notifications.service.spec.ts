import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const prismaMock = {
    notificationPreference: { upsert: jest.fn() },
    notificationReceipt: { findMany: jest.fn(), upsert: jest.fn() },
    athleteProfile: { findUnique: jest.fn() },
    scheduledWorkout: { findMany: jest.fn() },
    coachAthleteRelationship: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(NotificationsService);
    prismaMock.notificationPreference.upsert.mockResolvedValue({
      workoutReminders: true,
      coachUpdates: true,
      reminderLeadDays: 1,
    });
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);
    prismaMock.notificationReceipt.findMany.mockResolvedValue([]);
    prismaMock.scheduledWorkout.findMany.mockResolvedValue([]);
    prismaMock.coachAthleteRelationship.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns default preferences and an empty inbox', async () => {
    await expect(service.findAll('user-1')).resolves.toMatchObject({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('marks a notification as read for the authenticated user', async () => {
    prismaMock.notificationReceipt.upsert.mockResolvedValue({});
    await service.markRead('user-1', 'upcoming:scheduled-1');
    expect(prismaMock.notificationReceipt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_notificationKey: {
            userId: 'user-1',
            notificationKey: 'upcoming:scheduled-1',
          },
        },
      }),
    );
  });

  it('updates only the authenticated user preferences', async () => {
    await service.updatePreferences('user-1', { reminderLeadDays: 3 });
    expect(prismaMock.notificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: { reminderLeadDays: 3 },
      create: { userId: 'user-1', reminderLeadDays: 3 },
    });
  });
});
