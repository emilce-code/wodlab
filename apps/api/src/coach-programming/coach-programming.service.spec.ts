import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { CoachProgrammingService } from './coach-programming.service';

function delegate() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  };
}

function firstCall<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as unknown[][];
  return calls[0][0] as T;
}

describe('CoachProgrammingService', () => {
  const prisma = {
    coachProfile: delegate(),
    coachGroup: delegate(),
    coachGroupMember: delegate(),
    coachAthleteRelationship: delegate(),
    programTemplate: delegate(),
    workout: delegate(),
    workoutVariant: delegate(),
    prescriptionCategory: delegate(),
    scheduledWorkout: delegate(),
  };
  const service = new CoachProgrammingService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('requires a coach profile', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue(null);

    await expect(service.getWorkspace('user-1')).rejects.toThrow(
      new ForbiddenException('Coach profile required'),
    );
  });

  it('creates an athlete group owned by the coach', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachGroup.create.mockResolvedValue({ id: 'group-1' });

    await service.createGroup('user-1', {
      name: ' Competition ',
      description: ' Open athletes ',
    });

    const call = firstCall<{
      data: {
        coachProfileId: string;
        name: string;
        description: string;
      };
    }>(prisma.coachGroup.create);
    expect(call.data).toEqual({
      coachProfileId: 'coach-1',
      name: 'Competition',
      description: 'Open athletes',
    });
  });

  it('only adds actively connected athletes to a group', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachGroup.findFirst.mockResolvedValue({ id: 'group-1' });
    prisma.coachAthleteRelationship.findFirst.mockResolvedValue(null);

    await expect(
      service.addGroupMember('user-1', 'group-1', 'athlete-1'),
    ).rejects.toThrow(
      new ForbiddenException('Active coach relationship required'),
    );
  });

  it('requires at least one item in a program template', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });

    await expect(
      service.createTemplate('user-1', {
        name: 'Base week',
        items: [],
      }),
    ).rejects.toThrow(
      new BadRequestException('At least one template item is required'),
    );
  });

  it('creates a reusable template with validated workout variations', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.workoutVariant.findFirst.mockResolvedValue({ id: 'variant-1' });
    prisma.programTemplate.create.mockResolvedValue({ id: 'template-1' });

    await service.createTemplate('user-1', {
      name: 'Base week',
      items: [
        {
          dayOffset: 0,
          workoutId: 'workout-1',
          workoutVariantId: 'variant-1',
          coachNotes: 'Controlled pace',
        },
      ],
    });

    const call = firstCall<{
      data: {
        coachProfileId: string;
        name: string;
        items: {
          create: {
            dayOffset: number;
            workoutId: string;
            workoutVariantId: string;
          }[];
        };
      };
    }>(prisma.programTemplate.create);
    expect(call.data.coachProfileId).toBe('coach-1');
    expect(call.data.name).toBe('Base week');
    expect(call.data.items.create[0]).toEqual(
      expect.objectContaining({
        dayOffset: 0,
        workoutId: 'workout-1',
        workoutVariantId: 'variant-1',
      }),
    );
  });

  it('applies every template item to every active group member', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachGroup.findFirst.mockResolvedValue({
      id: 'group-1',
      members: [
        { athleteProfileId: 'athlete-1' },
        { athleteProfileId: 'athlete-2' },
      ],
    });
    prisma.programTemplate.findFirst.mockResolvedValue({
      id: 'template-1',
      items: [
        {
          dayOffset: 2,
          workoutId: 'workout-1',
          workoutVariantId: 'variant-1',
          prescriptionCategoryId: null,
          coachNotes: null,
          workout: { isActive: true },
        },
      ],
    });
    prisma.scheduledWorkout.createMany.mockResolvedValue({ count: 1 });

    const result = await service.applyTemplate('user-1', 'template-1', {
      groupId: 'group-1',
      weekStart: '2026-09-07',
    });

    expect(prisma.scheduledWorkout.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          athleteProfileId: 'athlete-1',
          scheduledDate: new Date('2026-09-09T00:00:00.000Z'),
        }),
        expect.objectContaining({
          athleteProfileId: 'athlete-2',
          scheduledDate: new Date('2026-09-09T00:00:00.000Z'),
        }),
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual({ requested: 2, created: 1, skipped: 1 });
  });

  it('summarizes planned, overdue, completed, and unreviewed assignments', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.scheduledWorkout.findMany.mockResolvedValue([
      {
        status: 'PLANNED',
        scheduledDate: new Date('2020-01-01T00:00:00.000Z'),
        reviewedAt: null,
      },
      {
        status: 'COMPLETED',
        scheduledDate: new Date('2026-09-08T00:00:00.000Z'),
        reviewedAt: null,
      },
      {
        status: 'COMPLETED',
        scheduledDate: new Date('2026-09-07T00:00:00.000Z'),
        reviewedAt: new Date(),
      },
    ]);

    const result = await service.getMonitoring('user-1', { status: 'ALL' });

    expect(result.summary).toEqual({
      total: 3,
      planned: 0,
      completed: 2,
      overdue: 1,
      needsReview: 1,
    });
  });

  it('rejects monitoring an athlete without an active relationship', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachAthleteRelationship.findFirst.mockResolvedValue(null);

    await expect(
      service.getMonitoring('user-1', { athleteProfileId: 'athlete-2' }),
    ).rejects.toThrow(
      new ForbiddenException('Active coach relationship required'),
    );
  });
});
