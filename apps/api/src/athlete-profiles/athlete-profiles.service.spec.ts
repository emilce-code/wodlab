import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AthleteTrainingGoal } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AthleteProfilesService } from './athlete-profiles.service';

describe('AthleteProfilesService', () => {
  let service: AthleteProfilesService;
  let lastUpdateData: Record<string, unknown> | undefined;
  const prisma = {
    athleteProfile: {
      findUnique: jest.fn(),
      update: jest.fn((input: { data: Record<string, unknown> }) => {
        lastUpdateData = input.data;
        return Promise.resolve({ id: 'profile-1' });
      }),
    },
    workoutLevel: { findUnique: jest.fn() },
    prescriptionCategory: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthleteProfilesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AthleteProfilesService>(AthleteProfilesService);
    jest.clearAllMocks();
    lastUpdateData = undefined;
  });

  it('returns the athlete profile with its defaults', async () => {
    prisma.athleteProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    await expect(service.findByUserId('user-1')).resolves.toEqual({
      id: 'profile-1',
    });
    expect(prisma.athleteProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        preferredWorkoutLevel: true,
        preferredPrescriptionCategory: true,
      },
    });
  });

  it('updates personalization and normalizes optional text', async () => {
    prisma.athleteProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    await service.updateByUserId('user-1', {
      avatarUrl: null,
      bio: '  Build strength and move well.  ',
      trainingGoals: [AthleteTrainingGoal.STRENGTH],
      weeklyTrainingTarget: 4,
      loadRoundingIncrement: 2.5,
    });
    expect(lastUpdateData).toMatchObject({
      avatarUrl: null,
      bio: 'Build strength and move well.',
      trainingGoals: [AthleteTrainingGoal.STRENGTH],
      weeklyTrainingTarget: 4,
      loadRoundingIncrement: 2.5,
    });
  });

  it('clears optional personalization', async () => {
    prisma.athleteProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    await service.updateByUserId('user-1', {
      bio: null,
      weeklyTrainingTarget: null,
      loadRoundingIncrement: null,
      trainingGoals: [],
    });
    expect(lastUpdateData).toMatchObject({
      bio: null,
      weeklyTrainingTarget: null,
      loadRoundingIncrement: null,
      trainingGoals: [],
    });
  });

  it('rejects an update when the athlete profile does not exist', async () => {
    prisma.athleteProfile.findUnique.mockResolvedValue(null);
    await expect(
      service.updateByUserId('missing-user', { displayName: 'Athlete' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
