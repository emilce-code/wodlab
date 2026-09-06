import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { CoachesService } from './coaches.service';

function delegate() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
}

function firstCall<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as unknown[][];
  return calls[0][0] as T;
}

describe('CoachesService', () => {
  const prisma = {
    user: delegate(),
    athleteProfile: delegate(),
    coachProfile: delegate(),
    coachAthleteRelationship: delegate(),
    workoutVariant: delegate(),
    prescriptionCategory: delegate(),
    scheduledWorkout: delegate(),
  };
  const service = new CoachesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a coach profile for an athlete user', async () => {
    prisma.coachProfile.upsert.mockResolvedValue({
      id: 'coach-1',
      displayName: 'Coach Emi',
    });

    await service.createProfile('user-1', { displayName: ' Coach Emi ' });

    const call = firstCall<{
      where: { userId: string };
      create: { displayName: string };
    }>(prisma.coachProfile.upsert);
    expect(call.where).toEqual({ userId: 'user-1' });
    expect(call.create.displayName).toBe('Coach Emi');
  });

  it('rejects an empty coach display name', async () => {
    await expect(
      service.createProfile('user-1', { displayName: '   ' }),
    ).rejects.toThrow(new BadRequestException('Display name is required'));
  });

  it('does not expose an athlete without an active relationship', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachAthleteRelationship.findFirst.mockResolvedValue(null);

    await expect(
      service.getAthleteOverview('user-1', 'athlete-2'),
    ).rejects.toThrow(
      new ForbiddenException('Active coach relationship required'),
    );
  });

  it('rejects self invitations', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.athleteProfile.findFirst.mockResolvedValue({
      id: 'athlete-1',
      userId: 'user-1',
    });

    await expect(
      service.inviteAthlete('user-1', 'coach@example.com'),
    ).rejects.toThrow(new BadRequestException('You cannot invite yourself'));
  });

  it('only lets the invited athlete accept an invitation', async () => {
    prisma.athleteProfile.findUnique.mockResolvedValue({ id: 'athlete-1' });
    prisma.coachAthleteRelationship.findFirst.mockResolvedValue(null);

    await expect(
      service.respondToInvitation('user-1', 'invite-1', 'ACCEPT'),
    ).rejects.toThrow(new NotFoundException('Invitation not found'));
  });

  it('assigns a workout through an active coach relationship', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.coachAthleteRelationship.findFirst.mockResolvedValue({
      id: 'relationship-1',
      status: 'ACTIVE',
    });
    prisma.workoutVariant.findFirst.mockResolvedValue({
      id: 'variant-1',
      workout: { isActive: true },
    });
    prisma.scheduledWorkout.create.mockResolvedValue({ id: 'assignment-1' });

    await service.assignWorkout('user-1', 'athlete-1', {
      workoutId: 'workout-1',
      workoutVariantId: 'variant-1',
      scheduledDate: '2026-09-08',
      coachNotes: 'Technique focus',
    });

    const call = firstCall<{
      data: {
        athleteProfileId: string;
        assignedByCoachProfileId: string;
        coachNotes: string;
      };
    }>(prisma.scheduledWorkout.create);
    expect(call.data).toEqual(
      expect.objectContaining({
        athleteProfileId: 'athlete-1',
        assignedByCoachProfileId: 'coach-1',
        coachNotes: 'Technique focus',
      }),
    );
  });

  it('only reviews completed assignments owned by the coach', async () => {
    prisma.coachProfile.findUnique.mockResolvedValue({ id: 'coach-1' });
    prisma.scheduledWorkout.findFirst.mockResolvedValue(null);

    await expect(
      service.reviewAssignment('user-1', 'assignment-1', {
        feedback: 'Great work',
      }),
    ).rejects.toThrow(new NotFoundException('Completed assignment not found'));
  });
});
