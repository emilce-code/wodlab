import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { WorkoutResultsService } from './workout-results.service';

type MockPrismaDelegate = {
  findUnique: jest.Mock;
  findUniqueOrThrow: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
};

type MockPrismaService = {
  athleteProfile: MockPrismaDelegate;
  measurementType: MockPrismaDelegate;
  movement: MockPrismaDelegate;
  movementResult: MockPrismaDelegate;
  prescriptionCategory: MockPrismaDelegate;
  resultType: MockPrismaDelegate;
  sectionType: MockPrismaDelegate;
  user: MockPrismaDelegate;
  workout: MockPrismaDelegate;
  workoutLevel: MockPrismaDelegate;
  workoutMovement: MockPrismaDelegate;
  workoutResult: MockPrismaDelegate;
  workoutResultMovement: MockPrismaDelegate;
  workoutType: MockPrismaDelegate;
  workoutVariant: MockPrismaDelegate;
  $transaction: jest.Mock;
};

type PerformedMovementFixture = {
  id: string;
  workoutMovementId: string;
  reps: number | null;
  load: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
};

type GeneratedMovementResult = {
  movementId: string;
  athleteProfileId: string;
  measurementTypeId: string;
  sourceWorkoutResultId: string;
  performedAt: Date;
  reps?: number;
  load?: number;
  weightUnit?: 'KG' | 'LB';
  distance?: number;
  durationSeconds?: number;
  calories?: number;
  notes?: string;
};

function getFirstMockCallArgument<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as unknown[][];

  return calls[0][0] as T;
}

function createDelegateMock(): MockPrismaDelegate {
  return {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  };
}

function createPrismaMock(): MockPrismaService {
  const prisma: MockPrismaService = {
    athleteProfile: createDelegateMock(),
    measurementType: createDelegateMock(),
    movement: createDelegateMock(),
    movementResult: createDelegateMock(),
    prescriptionCategory: createDelegateMock(),
    resultType: createDelegateMock(),
    sectionType: createDelegateMock(),
    user: createDelegateMock(),
    workout: createDelegateMock(),
    workoutLevel: createDelegateMock(),
    workoutMovement: createDelegateMock(),
    workoutResult: createDelegateMock(),
    workoutResultMovement: createDelegateMock(),
    workoutType: createDelegateMock(),
    workoutVariant: createDelegateMock(),
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (transaction: MockPrismaService) => Promise<unknown>) =>
      callback(prisma),
  );

  return prisma;
}

const USER_ID = 'user-1';
const ATHLETE_ID = 'athlete-1';
const WORKOUT_ID = 'workout-1';
const VARIANT_ID = 'variant-1';
const RESULT_ID = 'result-1';

const PERFORMED_AT = '2026-08-30T12:00:00.000Z';

function createWorkout(resultTypeKey = 'TIME') {
  return {
    id: WORKOUT_ID,
    name: 'Test Workout',
    isActive: true,

    type: {
      id: 'workout-type-1',
      key: 'TEST',
      name: 'Test',

      defaultResultType: {
        id: `result-type-${resultTypeKey.toLowerCase()}`,
        key: resultTypeKey,
        name: resultTypeKey,
      },
    },
  };
}

function createWorkoutMovement(
  options: {
    id?: string;
    movementId?: string;
    measurementTypes?: string[];
  } = {},
) {
  const {
    id = 'workout-movement-1',
    movementId = 'movement-1',
    measurementTypes = ['REPS'],
  } = options;

  return {
    id,
    movementId,

    movement: {
      measurementTypes: measurementTypes.map((key) => ({
        measurementType: {
          key,
        },
      })),
    },
  };
}

function createVariant(
  movements: ReturnType<typeof createWorkoutMovement>[] = [],
) {
  return {
    id: VARIANT_ID,
    workoutId: WORKOUT_ID,
    name: 'RX',

    level: {
      key: 'RX',
      name: 'RX',
    },

    sections: [
      {
        id: 'section-1',
        movements,
      },
    ],
  };
}

function createMappedResult(
  options: {
    id?: string;
    resultTypeKey?: string;
    timeSeconds?: number | null;
    rounds?: number | null;
    reps?: number | null;
    load?: number | null;
    weightUnit?: 'KG' | 'LB' | null;
    performedAt?: Date;
    performedMovements?: PerformedMovementFixture[];
    notes?: string | null;
  } = {},
) {
  const {
    id = RESULT_ID,
    resultTypeKey = 'TIME',
    timeSeconds = null,
    rounds = null,
    reps = null,
    load = null,
    weightUnit = null,
    performedAt = new Date(PERFORMED_AT),
    performedMovements = [],
    notes = null,
  } = options;

  return {
    id,
    workoutId: WORKOUT_ID,
    workoutVariantId: VARIANT_ID,
    athleteProfileId: ATHLETE_ID,
    performedAt,
    timeSeconds,
    rounds,
    reps,
    load,
    weightUnit,
    notes,

    createdAt: performedAt,
    updatedAt: performedAt,

    resultType: {
      key: resultTypeKey,
      name: resultTypeKey,
    },

    workoutVariant: {
      id: VARIANT_ID,
      name: 'RX',

      level: {
        key: 'RX',
        name: 'RX',
      },
    },

    prescriptionCategory: null,
    performedMovements,
  };
}

function setupCreateResult(
  prisma: MockPrismaService,
  options: {
    resultTypeKey?: string;
    variant?: ReturnType<typeof createVariant>;
    returnedResult?: ReturnType<typeof createMappedResult>;
  } = {},
) {
  const {
    resultTypeKey = 'TIME',
    variant = createVariant(),
    returnedResult = createMappedResult({
      resultTypeKey,
    }),
  } = options;

  prisma.athleteProfile.findUnique.mockResolvedValue({
    id: ATHLETE_ID,
    userId: USER_ID,
  });

  prisma.workout.findUnique.mockResolvedValue(createWorkout(resultTypeKey));

  prisma.workoutVariant.findFirst.mockResolvedValue(variant);

  prisma.workoutResult.create.mockResolvedValue({
    id: RESULT_ID,
  });

  prisma.workoutResult.findUniqueOrThrow.mockResolvedValue(returnedResult);
}

describe('WorkoutResultsService', () => {
  let service: WorkoutResultsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutResultsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<WorkoutResultsService>(WorkoutResultsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('test harness', () => {
    it('creates the service with mocked Prisma', () => {
      expect(service).toBeDefined();
      expect(prisma).toBeDefined();
    });

    it('executes Prisma calls through the mock', async () => {
      const resultTypes = [
        {
          key: 'TIME',
          name: 'Time',
          description: null,
        },
      ];

      prisma.resultType.findMany.mockResolvedValue(resultTypes);

      const result = await service.findResultTypes();

      expect(result).toEqual(resultTypes);

      expect(prisma.resultType.findMany).toHaveBeenCalledWith({
        orderBy: {
          sortOrder: 'asc',
        },

        select: {
          key: true,
          name: true,
          description: true,
        },
      });
    });
  });

  describe('createResult', () => {
    it('rejects new results for an inactive workout', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue({ id: ATHLETE_ID });
      prisma.workout.findUnique.mockResolvedValue({
        ...createWorkout('TIME'),
        isActive: false,
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          performedAt: PERFORMED_AT,
          timeSeconds: 300,
        }),
      ).rejects.toThrow(
        new ConflictException('Inactive workouts cannot accept new results'),
      );
    });

    it('creates a TIME workout result', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'TIME',

        returnedResult: createMappedResult({
          resultTypeKey: 'TIME',
          timeSeconds: 315,
        }),
      });

      const result = await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        performedAt: PERFORMED_AT,
        timeSeconds: 315,
      });

      expect(result.timeSeconds).toBe(315);

      const createCall = getFirstMockCallArgument<{ data: unknown }>(
        prisma.workoutResult.create,
      );

      expect(createCall.data).toEqual(
        expect.objectContaining({
          performedAt: new Date(PERFORMED_AT),
          timeSeconds: 315,
        }),
      );
    });

    it('creates a ROUNDS_REPS workout result', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'ROUNDS_REPS',

        returnedResult: createMappedResult({
          resultTypeKey: 'ROUNDS_REPS',
          rounds: 8,
          reps: 12,
        }),
      });

      const result = await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        performedAt: PERFORMED_AT,
        rounds: 8,
        reps: 12,
      });

      expect(result.rounds).toBe(8);
      expect(result.reps).toBe(12);
    });

    it('creates a REPS workout result', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'REPS',

        returnedResult: createMappedResult({
          resultTypeKey: 'REPS',
          reps: 50,
        }),
      });

      const result = await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        performedAt: PERFORMED_AT,
        reps: 50,
      });

      expect(result.reps).toBe(50);
    });

    it('creates a LOAD workout result', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'LOAD',

        returnedResult: createMappedResult({
          resultTypeKey: 'LOAD',
          load: 100,
          weightUnit: 'KG',
        }),
      });

      const result = await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        performedAt: PERFORMED_AT,
        load: 100,
        weightUnit: 'KG',
      });

      expect(result.load).toBe(100);

      expect(result.weightUnit).toBe('KG');
    });

    it('rejects a missing athlete profile', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          timeSeconds: 300,
        }),
      ).rejects.toThrow(new NotFoundException('Athlete profile not found'));
    });

    it('rejects a missing workout', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workout.findUnique.mockResolvedValue(null);

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          timeSeconds: 300,
        }),
      ).rejects.toThrow(new NotFoundException('Workout not found'));
    });

    it('rejects a variant that does not belong to the workout', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workout.findUnique.mockResolvedValue(createWorkout('TIME'));

      prisma.workoutVariant.findFirst.mockResolvedValue(null);

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: 'other-variant',
          timeSeconds: 300,
        }),
      ).rejects.toThrow(
        new NotFoundException('Workout variant not found for this workout'),
      );

      expect(prisma.workoutVariant.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'other-variant',
            workoutId: WORKOUT_ID,
          },
        }),
      );
    });

    it('rejects duplicate submitted workout movements', async () => {
      const workoutMovement = createWorkoutMovement();

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          timeSeconds: 300,

          movements: [
            {
              workoutMovementId: workoutMovement.id,
              reps: 10,
            },
            {
              workoutMovementId: workoutMovement.id,
              reps: 12,
            },
          ],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'A workout movement can only be submitted once per workout result',
        ),
      );
    });

    it('rejects a submitted movement outside the selected variant', async () => {
      setupCreateResult(prisma, {
        variant: createVariant([createWorkoutMovement()]),
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          timeSeconds: 300,

          movements: [
            {
              workoutMovementId: 'outside-movement',
              reps: 10,
            },
          ],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Workout movement "outside-movement" does not belong to the selected workout variant',
        ),
      );
    });

    it('requires timeSeconds for TIME workouts', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'TIME',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
        }),
      ).rejects.toThrow('timeSeconds is required for time-based workouts');
    });

    it('requires rounds or reps for ROUNDS_REPS workouts', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'ROUNDS_REPS',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
        }),
      ).rejects.toThrow(
        'rounds or reps is required for rounds + reps workouts',
      );
    });

    it('requires reps for REPS workouts', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'REPS',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
        }),
      ).rejects.toThrow('reps is required for repetition-based workouts');
    });

    it('requires load for LOAD workouts', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'LOAD',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          weightUnit: 'KG',
        }),
      ).rejects.toThrow('load is required for load-based workouts');
    });

    it('requires weightUnit for LOAD workouts', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'LOAD',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          load: 100,
        }),
      ).rejects.toThrow('weightUnit is required for load-based workouts');
    });

    it('rejects unsupported result types', async () => {
      setupCreateResult(prisma, {
        resultTypeKey: 'UNKNOWN',
      });

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
        }),
      ).rejects.toThrow('Unsupported result type "UNKNOWN"');
    });
  });

  describe('generated movement results', () => {
    it('generates WEIGHT instead of REPS when a movement supports both', async () => {
      const workoutMovement = createWorkoutMovement({
        movementId: 'back-squat',
        measurementTypes: ['WEIGHT', 'REPS'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-weight',
          key: 'WEIGHT',
        },
      ]);

      await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        timeSeconds: 300,
        performedAt: PERFORMED_AT,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            reps: 5,
            load: 100,
            weightUnit: 'KG',
          },
        ],
      });

      expect(prisma.movementResult.createMany).toHaveBeenCalledTimes(1);

      const call = getFirstMockCallArgument<{
        data: GeneratedMovementResult[];
      }>(prisma.movementResult.createMany);

      expect(call.data).toHaveLength(1);

      expect(call.data[0]).toEqual({
        movementId: 'back-squat',
        athleteProfileId: ATHLETE_ID,
        measurementTypeId: 'measurement-weight',
        sourceWorkoutResultId: RESULT_ID,
        performedAt: new Date(PERFORMED_AT),
        reps: 5,
        load: 100,
        weightUnit: 'KG',
        notes: undefined,
      });
    });

    it('generates REPS when WEIGHT data is incomplete', async () => {
      const workoutMovement = createWorkoutMovement({
        movementId: 'pull-up',
        measurementTypes: ['WEIGHT', 'REPS'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-reps',
          key: 'REPS',
        },
      ]);

      await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        timeSeconds: 300,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            reps: 20,
          },
        ],
      });

      const call = getFirstMockCallArgument<{
        data: GeneratedMovementResult[];
      }>(prisma.movementResult.createMany);

      expect(call.data).toHaveLength(1);

      expect(call.data[0]).toEqual(
        expect.objectContaining({
          movementId: 'pull-up',
          measurementTypeId: 'measurement-reps',
          reps: 20,
        }),
      );
    });

    it('generates independent DISTANCE and DURATION results', async () => {
      const workoutMovement = createWorkoutMovement({
        movementId: 'run',
        measurementTypes: ['DISTANCE', 'DURATION'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-distance',
          key: 'DISTANCE',
        },
        {
          id: 'measurement-duration',
          key: 'DURATION',
        },
      ]);

      await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        timeSeconds: 1500,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            distance: 5000,
            durationSeconds: 1500,
          },
        ],
      });

      const { data } = getFirstMockCallArgument<{
        data: GeneratedMovementResult[];
      }>(prisma.movementResult.createMany);

      expect(data).toHaveLength(2);

      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            movementId: 'run',
            measurementTypeId: 'measurement-distance',
            distance: 5000,
          }),

          expect.objectContaining({
            movementId: 'run',
            measurementTypeId: 'measurement-duration',
            durationSeconds: 1500,
          }),
        ]),
      );
    });

    it('generates independent DISTANCE and CALORIES results', async () => {
      const workoutMovement = createWorkoutMovement({
        movementId: 'row',
        measurementTypes: ['DISTANCE', 'CALORIES'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-distance',
          key: 'DISTANCE',
        },
        {
          id: 'measurement-calories',
          key: 'CALORIES',
        },
      ]);

      await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        timeSeconds: 300,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            distance: 1000,
            calories: 60,
          },
        ],
      });

      const { data } = getFirstMockCallArgument<{
        data: GeneratedMovementResult[];
      }>(prisma.movementResult.createMany);

      expect(data).toHaveLength(2);

      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            measurementTypeId: 'measurement-distance',
            distance: 1000,
          }),

          expect.objectContaining({
            measurementTypeId: 'measurement-calories',
            calories: 60,
          }),
        ]),
      );
    });

    it('does not create generated results when no supported metric was submitted', async () => {
      const workoutMovement = createWorkoutMovement({
        measurementTypes: ['REPS'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      await service.createResult(USER_ID, WORKOUT_ID, {
        workoutVariantId: VARIANT_ID,
        timeSeconds: 300,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            notes: 'No metric',
          },
        ],
      });

      expect(prisma.measurementType.findMany).not.toHaveBeenCalled();

      expect(prisma.movementResult.createMany).not.toHaveBeenCalled();
    });

    it('fails if a required measurement type is missing from the database', async () => {
      const workoutMovement = createWorkoutMovement({
        measurementTypes: ['WEIGHT'],
      });

      setupCreateResult(prisma, {
        variant: createVariant([workoutMovement]),
      });

      prisma.measurementType.findMany.mockResolvedValue([]);

      await expect(
        service.createResult(USER_ID, WORKOUT_ID, {
          workoutVariantId: VARIANT_ID,
          timeSeconds: 300,

          movements: [
            {
              workoutMovementId: workoutMovement.id,
              reps: 5,
              load: 100,
              weightUnit: 'KG',
            },
          ],
        }),
      ).rejects.toThrow(
        new NotFoundException('WEIGHT measurement type not found'),
      );
    });
  });

  describe('updateResult', () => {
    it('rejects edits to results from an inactive workout', async () => {
      setupUpdateResult();
      prisma.workout.findUnique.mockResolvedValue({
        ...createWorkout('TIME'),
        isActive: false,
      });

      await expect(
        service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
          timeSeconds: 300,
        }),
      ).rejects.toThrow(
        new ConflictException('Inactive workout results are read-only'),
      );
    });

    function setupUpdateResult(
      options: {
        existingMovements?: PerformedMovementFixture[];
        measurementTypes?: string[];
      } = {},
    ) {
      const { existingMovements = [], measurementTypes = ['WEIGHT', 'REPS'] } =
        options;

      const workoutMovement = createWorkoutMovement({
        movementId: 'back-squat',
        measurementTypes,
      });

      const variant = createVariant([workoutMovement]);

      const existingResult = {
        id: RESULT_ID,
        workoutId: WORKOUT_ID,
        athleteProfileId: ATHLETE_ID,
        workoutVariantId: VARIANT_ID,
        prescriptionCategoryId: null,

        performedAt: new Date('2026-08-29T12:00:00.000Z'),

        timeSeconds: 300,
        rounds: null,
        reps: null,
        load: null,
        weightUnit: null,
        notes: 'Original notes',

        resultType: {
          id: 'result-type-time',
          key: 'TIME',
          name: 'Time',
        },

        workoutVariant: variant,

        prescriptionCategory: null,

        performedMovements: existingMovements,
      };

      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workoutResult.findFirst.mockResolvedValue(existingResult);

      prisma.workout.findUnique.mockResolvedValue(createWorkout('TIME'));

      prisma.workoutVariant.findFirst.mockResolvedValue(variant);

      prisma.workoutResult.update.mockResolvedValue({
        id: RESULT_ID,
      });

      prisma.workoutResult.findUniqueOrThrow.mockResolvedValue(
        createMappedResult({
          resultTypeKey: 'TIME',
          timeSeconds: 300,
        }),
      );

      return {
        workoutMovement,
        existingResult,
      };
    }

    it('replaces performed and generated movement results when editing', async () => {
      const { workoutMovement } = setupUpdateResult();

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-weight',
          key: 'WEIGHT',
        },
      ]);

      await service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
        performedAt: PERFORMED_AT,
        timeSeconds: 290,

        movements: [
          {
            workoutMovementId: workoutMovement.id,
            reps: 5,
            load: 105,
            weightUnit: 'KG',
          },
        ],
      });

      expect(prisma.workoutResultMovement.deleteMany).toHaveBeenCalledWith({
        where: {
          workoutResultId: RESULT_ID,
        },
      });

      expect(prisma.movementResult.deleteMany).toHaveBeenCalledWith({
        where: {
          sourceWorkoutResultId: RESULT_ID,
        },
      });

      const updateCall = getFirstMockCallArgument<{ data: unknown }>(
        prisma.workoutResult.update,
      );

      expect(updateCall.data).toEqual(
        expect.objectContaining({
          timeSeconds: 290,

          performedMovements: {
            create: [
              expect.objectContaining({
                reps: 5,
                load: 105,
                weightUnit: 'KG',
              }),
            ],
          },
        }),
      );

      expect(prisma.movementResult.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            movementId: 'back-squat',
            athleteProfileId: ATHLETE_ID,
            sourceWorkoutResultId: RESULT_ID,
            measurementTypeId: 'measurement-weight',
            reps: 5,
            load: 105,
            weightUnit: 'KG',
          }),
        ],
      });
    });

    it('preserves performed movements when movements is omitted', async () => {
      const existingMovement = {
        id: 'performed-1',

        workoutMovementId: 'workout-movement-1',

        reps: 5,
        load: 100,
        weightUnit: 'KG',
        distance: null,
        calories: null,
        durationSeconds: null,
        notes: 'Existing',
      };

      setupUpdateResult({
        existingMovements: [existingMovement],
      });

      prisma.measurementType.findMany.mockResolvedValue([
        {
          id: 'measurement-weight',
          key: 'WEIGHT',
        },
      ]);

      await service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
        timeSeconds: 295,
      });

      const updateCall = getFirstMockCallArgument<{ data: unknown }>(
        prisma.workoutResult.update,
      );

      expect(updateCall.data).toEqual(
        expect.objectContaining({
          performedMovements: {
            create: [
              expect.objectContaining({
                workoutMovement: {
                  connect: {
                    id: 'workout-movement-1',
                  },
                },

                reps: 5,
                load: 100,
                weightUnit: 'KG',
              }),
            ],
          },
        }),
      );

      expect(prisma.movementResult.createMany).toHaveBeenCalledTimes(1);
    });

    it('removes all performed and generated movement results when movements is an empty array', async () => {
      setupUpdateResult({
        existingMovements: [
          {
            id: 'performed-1',
            workoutMovementId: 'workout-movement-1',
            reps: 5,
            load: 100,
            weightUnit: 'KG',
            distance: null,
            calories: null,
            durationSeconds: null,
            notes: null,
          },
        ],
      });

      await service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
        timeSeconds: 295,
        movements: [],
      });

      expect(prisma.workoutResultMovement.deleteMany).toHaveBeenCalled();

      expect(prisma.movementResult.deleteMany).toHaveBeenCalled();

      expect(prisma.movementResult.createMany).not.toHaveBeenCalled();

      const updateCall = getFirstMockCallArgument<{
        data: {
          performedMovements?: unknown;
        };
      }>(prisma.workoutResult.update);

      expect(updateCall.data.performedMovements).toBeUndefined();
    });

    it('rejects a workout result that does not belong to the athlete/workout', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workoutResult.findFirst.mockResolvedValue(null);

      await expect(
        service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
          timeSeconds: 300,
        }),
      ).rejects.toThrow(new NotFoundException('Workout result not found'));

      expect(prisma.workoutResult.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: RESULT_ID,
            workoutId: WORKOUT_ID,
            athleteProfileId: ATHLETE_ID,
          },
        }),
      );
    });

    it('rejects duplicate movements during update', async () => {
      const { workoutMovement } = setupUpdateResult();

      await expect(
        service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
          timeSeconds: 300,

          movements: [
            {
              workoutMovementId: workoutMovement.id,
              reps: 5,
            },
            {
              workoutMovementId: workoutMovement.id,
              reps: 6,
            },
          ],
        }),
      ).rejects.toThrow(
        'A workout movement can only be submitted once per workout result',
      );
    });

    it('rejects movement data from outside the selected variant during update', async () => {
      setupUpdateResult();

      await expect(
        service.updateResult(USER_ID, WORKOUT_ID, RESULT_ID, {
          timeSeconds: 300,

          movements: [
            {
              workoutMovementId: 'outside-movement',
              reps: 10,
            },
          ],
        }),
      ).rejects.toThrow(
        'Workout movement "outside-movement" does not belong to the selected workout variant',
      );
    });
  });

  describe('deleteResult', () => {
    function setupDeleteResult() {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workoutResult.findFirst.mockResolvedValue({
        id: RESULT_ID,
      });

      prisma.workout.findUnique.mockResolvedValue({
        isActive: true,
      });

      prisma.movementResult.deleteMany.mockResolvedValue({
        count: 1,
      });

      prisma.workoutResultMovement.deleteMany.mockResolvedValue({
        count: 1,
      });

      prisma.workoutResult.delete.mockResolvedValue({
        id: RESULT_ID,
      });
    }

    it('deletes generated movement results before deleting the workout result', async () => {
      setupDeleteResult();

      const result = await service.deleteResult(USER_ID, WORKOUT_ID, RESULT_ID);

      expect(prisma.movementResult.deleteMany).toHaveBeenCalledWith({
        where: {
          sourceWorkoutResultId: RESULT_ID,
        },
      });

      expect(prisma.workoutResultMovement.deleteMany).toHaveBeenCalledWith({
        where: {
          workoutResultId: RESULT_ID,
        },
      });

      expect(prisma.workoutResult.delete).toHaveBeenCalledWith({
        where: {
          id: RESULT_ID,
        },
      });

      expect(result).toEqual({
        id: RESULT_ID,
        deleted: true,
      });
    });

    it('scopes deletion by result, workout, and athlete', async () => {
      setupDeleteResult();

      await service.deleteResult(USER_ID, WORKOUT_ID, RESULT_ID);

      expect(prisma.workoutResult.findFirst).toHaveBeenCalledWith({
        where: {
          id: RESULT_ID,
          workoutId: WORKOUT_ID,
          athleteProfileId: ATHLETE_ID,
        },

        select: {
          id: true,
        },
      });
    });

    it('rejects deletion when the result does not belong to the athlete', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workoutResult.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteResult(USER_ID, WORKOUT_ID, RESULT_ID),
      ).rejects.toThrow(new NotFoundException('Workout result not found'));

      expect(prisma.workoutResult.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion when the athlete profile does not exist', async () => {
      prisma.athleteProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteResult(USER_ID, WORKOUT_ID, RESULT_ID),
      ).rejects.toThrow(new NotFoundException('Athlete profile not found'));

      expect(prisma.workoutResult.findFirst).not.toHaveBeenCalled();
    });

    it('rejects deletion from an inactive workout', async () => {
      setupDeleteResult();
      prisma.workout.findUnique.mockResolvedValue({ isActive: false });

      await expect(
        service.deleteResult(USER_ID, WORKOUT_ID, RESULT_ID),
      ).rejects.toThrow(
        new ConflictException('Inactive workout results are read-only'),
      );

      expect(prisma.workoutResult.delete).not.toHaveBeenCalled();
    });
  });

  describe('findResultSummary personal best', () => {
    function setupSummary(
      resultTypeKey: string,
      results: ReturnType<typeof createMappedResult>[],
    ) {
      prisma.athleteProfile.findUnique.mockResolvedValue({
        id: ATHLETE_ID,
      });

      prisma.workout.findUnique.mockResolvedValue(createWorkout(resultTypeKey));

      prisma.workoutResult.findMany.mockResolvedValue(results);
    }

    it('selects the lowest TIME result as PB', async () => {
      setupSummary('TIME', [
        createMappedResult({
          id: 'result-330',
          resultTypeKey: 'TIME',
          timeSeconds: 330,
        }),

        createMappedResult({
          id: 'result-310',
          resultTypeKey: 'TIME',
          timeSeconds: 310,
        }),

        createMappedResult({
          id: 'result-325',
          resultTypeKey: 'TIME',
          timeSeconds: 325,
        }),
      ]);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest.id).toBe('result-310');

      expect(result.personalBest.timeSeconds).toBe(310);
    });

    it('selects rounds before reps for ROUNDS_REPS PB', async () => {
      setupSummary('ROUNDS_REPS', [
        createMappedResult({
          id: 'result-a',
          resultTypeKey: 'ROUNDS_REPS',
          rounds: 7,
          reps: 20,
        }),

        createMappedResult({
          id: 'result-b',
          resultTypeKey: 'ROUNDS_REPS',
          rounds: 8,
          reps: 2,
        }),

        createMappedResult({
          id: 'result-c',
          resultTypeKey: 'ROUNDS_REPS',
          rounds: 7,
          reps: 30,
        }),
      ]);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest.id).toBe('result-b');

      expect(result.personalBest.rounds).toBe(8);

      expect(result.personalBest.reps).toBe(2);
    });

    it('selects the highest REPS result as PB', async () => {
      setupSummary('REPS', [
        createMappedResult({
          id: 'result-42',
          resultTypeKey: 'REPS',
          reps: 42,
        }),

        createMappedResult({
          id: 'result-50',
          resultTypeKey: 'REPS',
          reps: 50,
        }),

        createMappedResult({
          id: 'result-47',
          resultTypeKey: 'REPS',
          reps: 47,
        }),
      ]);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest.id).toBe('result-50');

      expect(result.personalBest.reps).toBe(50);
    });

    it('normalizes LB to KG when comparing LOAD results', async () => {
      setupSummary('LOAD', [
        createMappedResult({
          id: 'result-100kg',
          resultTypeKey: 'LOAD',
          load: 100,
          weightUnit: 'KG',
        }),

        createMappedResult({
          id: 'result-225lb',
          resultTypeKey: 'LOAD',
          load: 225,
          weightUnit: 'LB',
        }),

        createMappedResult({
          id: 'result-101kg',
          resultTypeKey: 'LOAD',
          load: 101,
          weightUnit: 'KG',
        }),
      ]);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest.id).toBe('result-225lb');

      expect(result.personalBest.load).toBe(225);

      expect(result.personalBest.weightUnit).toBe('LB');
    });

    it('recalculates PB from the remaining result set', async () => {
      setupSummary('LOAD', [
        createMappedResult({
          id: 'result-100',
          resultTypeKey: 'LOAD',
          load: 100,
          weightUnit: 'KG',
        }),

        createMappedResult({
          id: 'result-105',
          resultTypeKey: 'LOAD',
          load: 105,
          weightUnit: 'KG',
        }),
      ]);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest.id).toBe('result-105');

      expect(result.personalBest.load).toBe(105);
    });

    it('returns null PB when there are no results', async () => {
      setupSummary('TIME', []);

      const result = await service.findResultSummary(USER_ID, WORKOUT_ID);

      expect(result.personalBest).toBeNull();

      expect(result.lastResult).toBeNull();

      expect(result.totalResults).toBe(0);
    });
  });
});
