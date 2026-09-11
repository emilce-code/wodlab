import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AthleteTrainingLoadService } from './athlete-training-load.service';

describe('AthleteTrainingLoadService', () => {
  let service: AthleteTrainingLoadService;
  const prismaMock = {
    athleteProfile: { findUnique: jest.fn() },
    workoutResult: { findMany: jest.fn() },
    movementResult: { findMany: jest.fn() },
  };
  const now = new Date('2026-09-10T15:00:00.000Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthleteTrainingLoadService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AthleteTrainingLoadService);
    prismaMock.athleteProfile.findUnique.mockResolvedValue({ id: 'athlete-1' });
    prismaMock.workoutResult.findMany.mockResolvedValue([]);
    prismaMock.movementResult.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('requires an athlete profile', async () => {
    prismaMock.athleteProfile.findUnique.mockResolvedValue(null);
    await expect(service.getTrainingLoad('user-1', now)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('builds a baseline from logged sessions and normalizes pounds', async () => {
    prismaMock.workoutResult.findMany.mockResolvedValue([
      {
        performedAt: new Date('2026-09-09T12:00:00Z'),
        load: 220,
        reps: 5,
        weightUnit: 'LB',
        performedMovements: [],
      },
      {
        performedAt: new Date('2026-09-08T12:00:00Z'),
        load: null,
        reps: null,
        weightUnit: null,
        performedMovements: [],
      },
      {
        performedAt: new Date('2026-08-25T12:00:00Z'),
        load: 100,
        reps: 5,
        weightUnit: 'KG',
        performedMovements: [],
      },
    ]);
    const result = await service.getTrainingLoad('user-1', now);
    expect(result.sessionsLast7Days).toBe(2);
    expect(result.sessionsLast28Days).toBe(3);
    expect(result.volumeKgLast7Days).toBeCloseTo(499, 0);
    expect(result.weeks).toHaveLength(8);
  });

  it('groups multiple logs on one date as one training session', async () => {
    prismaMock.movementResult.findMany.mockResolvedValue([
      {
        performedAt: new Date('2026-09-09T10:00:00Z'),
        load: 50,
        reps: 5,
        weightUnit: 'KG',
      },
      {
        performedAt: new Date('2026-09-09T18:00:00Z'),
        load: 60,
        reps: 5,
        weightUnit: 'KG',
      },
    ]);
    const result = await service.getTrainingLoad('user-1', now);
    expect(result.sessionsLast7Days).toBe(1);
    expect(result.volumeKgLast7Days).toBe(550);
  });
});
