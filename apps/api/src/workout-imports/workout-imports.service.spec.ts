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
    {
      id: 'air-squat',
      name: 'Air Squat',
      aliases: [],
      category: { key: 'WEIGHTLIFTING', name: 'Weightlifting' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
      ],
    },
    {
      id: 'kip-swing',
      name: 'Kip Swing',
      aliases: ['Kipping Swing'],
      category: { key: 'GYMNASTICS', name: 'Gymnastics' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
      ],
    },
    {
      id: 'db-power-snatch',
      name: 'Dumbbell Power Snatch',
      aliases: ['DB Power Snatch', 'DB Snatch'],
      category: { key: 'WEIGHTLIFTING', name: 'Weightlifting' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
        { measurementType: { key: 'WEIGHT', name: 'Weight' } },
      ],
    },
    {
      id: 'box-jump',
      name: 'Box Jump',
      aliases: [],
      category: { key: 'GYMNASTICS', name: 'Gymnastics' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
      ],
    },
    {
      id: 'run',
      name: 'Run',
      aliases: ['Running'],
      category: { key: 'MONOSTRUCTURAL', name: 'Monostructural' },
      measurementTypes: [
        { measurementType: { key: 'DISTANCE', name: 'Distance' } },
      ],
    },
    {
      id: 'back-squat',
      name: 'Back Squat',
      aliases: [],
      category: { key: 'WEIGHTLIFTING', name: 'Weightlifting' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
        { measurementType: { key: 'WEIGHT', name: 'Weight' } },
      ],
    },
    {
      id: 'wall-ball-shot',
      name: 'Wall-ball Shot',
      aliases: ['Wall Ball', 'Wall-ball'],
      category: { key: 'WEIGHTLIFTING', name: 'Weightlifting' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
        { measurementType: { key: 'WEIGHT', name: 'Weight' } },
      ],
    },
    {
      id: 'kipping-toes-to-bar',
      name: 'Kipping Toes-to-bar',
      aliases: ['T2B', 'TTB'],
      category: { key: 'GYMNASTICS', name: 'Gymnastics' },
      measurementTypes: [
        { measurementType: { key: 'REPS', name: 'Repetitions' } },
      ],
    },
    {
      id: 'strict-toes-to-bar',
      name: 'Strict Toes-to-bar',
      aliases: ['Strict T2B'],
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

  it('fully matches the built-in importer examples', () => {
    const examples = [
      {
        text: 'Fran\nFor time\n21-15-9\nThrusters 43 kg\nPull-ups',
        roles: ['WOD'],
      },
      {
        text: [
          'Friday Training',
          'Warm-up',
          '3 rounds',
          '10 air squats',
          '10 kip swings',
          '',
          'WOD - 12 min AMRAP',
          '8 DB snatches 22.5/15 kg',
          '10 box jumps',
          '200 m run',
        ].join('\n'),
        roles: ['WARM_UP', 'WOD'],
      },
      {
        text: [
          'Strength + WOD',
          'Strength',
          '5 sets',
          '5 back squats 80 kg',
          '',
          'WOD',
          'For time',
          '21-15-9',
          'Wall balls 9/6 kg',
          'Toes-to-bar',
        ].join('\n'),
        roles: ['STRENGTH', 'WOD'],
      },
      {
        text: [
          'Entrenamiento',
          'Calentamiento',
          '3 rondas',
          '10 air squats',
          'Fuerza',
          '5 series',
          '5 back squats 80 kg',
          'WOD',
          'Por tiempo',
          '21-15-9',
          'Wall balls 9/6 kg',
          'Toes-to-bar',
        ].join('\n'),
        roles: ['WARM_UP', 'STRENGTH', 'WOD'],
      },
      {
        text: [
          'Treino',
          'Aquecimento',
          '3 rounds',
          '10 air squats',
          'Força',
          '5 séries',
          '5 back squats 80 kg',
          'WOD',
          'Por tempo',
          '21-15-9',
          'Wall balls 9/6 kg',
          'Toes-to-bar',
        ].join('\n'),
        roles: ['WARM_UP', 'STRENGTH', 'WOD'],
      },
    ];

    for (const example of examples) {
      const result = service.parseWithCatalog(example.text, catalog);

      expect(result.summary.unresolvedMovements).toBe(0);
      expect(
        result.draft.variants[0].sections.map((section) => section.role),
      ).toEqual(example.roles);
      expect(result.issues).toEqual(
        result.issues.filter((issue) => issue.code === 'MULTIPLE_LOADS'),
      );
      expect(
        result.draft.section.movements.every(
          (movement) => movement.matchStatus === 'MATCHED',
        ),
      ).toBe(true);
    }
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

  it('parses localized levels and gender prescriptions', () => {
    const result = service.parseWithCatalog(
      [
        'Fran',
        'For time',
        '21-15-9',
        'RX',
        'Hombres: Thrusters 95 lb',
        'Mujeres: Thrusters 65 lb',
        'Pull-ups',
        'Intermediário',
        'Homens: Thrusters 75 lb',
        'Mulheres: Thrusters 55 lb',
        'Pull-ups',
        'Principiante',
        'Masculino: Thrusters 45 lb',
        'Feminino: Thrusters 35 lb',
        'Pull-ups',
      ].join('\n'),
      catalog,
    );

    expect(result.draft.variants.map((variant) => variant.levelKey)).toEqual([
      'RX',
      'INTERMEDIATE',
      'BEGINNER',
    ]);
    expect(
      result.draft.variants.map((variant) =>
        variant.section.movements[0].prescriptions.map((item) => ({
          categoryKey: item.categoryKey,
          weight: item.weight,
        })),
      ),
    ).toEqual([
      [
        { categoryKey: 'MEN', weight: 95 },
        { categoryKey: 'WOMEN', weight: 65 },
      ],
      [
        { categoryKey: 'MEN', weight: 75 },
        { categoryKey: 'WOMEN', weight: 55 },
      ],
      [
        { categoryKey: 'MEN', weight: 45 },
        { categoryKey: 'WOMEN', weight: 35 },
      ],
    ]);
    expect(result.summary).toMatchObject({
      detectedVariants: 3,
      detectedPrescriptions: 6,
      matchedMovements: 6,
      unresolvedMovements: 0,
    });
  });
});
