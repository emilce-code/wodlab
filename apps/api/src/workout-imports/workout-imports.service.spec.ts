import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WorkoutImportsService } from './workout-imports.service';

describe('WorkoutImportsService', () => {
  let service: WorkoutImportsService;
  const prisma = { movement: { findMany: jest.fn() } };
  const catalog = [
    {
      id: 'thruster',
      name: 'Thruster',
      aliases: ['Thrusters'],
      category: { key: 'WEIGHTLIFTING', name: 'Weightlifting' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
        { measurementType: { key: 'WEIGHT', name: 'Weight' } },
      ],
    },
    {
      id: 'pull-up',
      name: 'Pull-up',
      aliases: ['Pull-ups'],
      category: { key: 'GYMNASTICS', name: 'Gymnastics' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
      ],
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkoutImportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(WorkoutImportsService);
    prisma.movement.findMany.mockResolvedValue(catalog);
  });

  afterEach(() => jest.clearAllMocks());

  it('parses a common for-time workout into an editable draft', async () => {
    const result = await service.parse(
      'Fran\nFor time\n21-15-9\nThrusters 95 lb\nPull-ups',
    );

    expect(result.draft).toMatchObject({
      name: 'Fran',
      typeKey: 'FOR_TIME',
      section: { typeKey: 'FOR_TIME', repScheme: [21, 15, 9] },
    });
    expect(result.draft.section.movements).toHaveLength(2);
    expect(result.draft.section.movements[0]).toMatchObject({
      matchStatus: 'MATCHED',
      movement: { id: 'thruster' },
      weight: 95,
      weightUnit: 'LB',
    });
    expect(result.summary).toMatchObject({
      matchedMovements: 2,
      unresolvedMovements: 0,
    });
  });

  it('detects AMRAP duration and movement repetitions', () => {
    const result = service.parseWithCatalog(
      'Cindy\nAMRAP 20 min\n5 Pull-ups\n10 Thrusters',
      catalog,
    );

    expect(result.draft.section.durationSeconds).toBe(1200);
    expect(result.draft.section.movements.map((item) => item.reps)).toEqual([
      5, 10,
    ]);
  });

  it('keeps unknown movements visible for manual review', () => {
    const result = service.parseWithCatalog(
      'Custom\nFor time\n10 Mystery flips',
      catalog,
    );

    expect(result.summary.unresolvedMovements).toBe(1);
    expect(result.issues[0]).toMatchObject({
      code: 'UNKNOWN_MOVEMENT',
      line: 3,
    });
  });

  it('flags dual loads because they require category review', () => {
    const result = service.parseWithCatalog(
      'Fran\nFor time\nThrusters 95/65 lb',
      catalog,
    );

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MULTIPLE_LOADS' }),
      ]),
    );
  });
});
