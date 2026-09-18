import type { Prisma, PrismaClient } from '../../generated/prisma/client';
import {
  AthleteTrainingGoal,
  BoxMemberRole,
  ClassBookingStatus,
  CoachAthleteStatus,
  MovementScope,
  ScheduledWorkoutStatus,
  UserRole,
  WeightUnit,
  WorkoutScope,
} from '../../generated/prisma/enums';
import { buildMovementSearchText, requireId } from './helpers';

const DEMO_PREFIX = 'local_demo_';
const USER_COUNT = 30;
const HISTORY_DAYS = 96;
const ACCOUNT_AGE_DAYS = 120;
const primaryDemoAuth0UserId =
  process.env.WODLY_DEMO_AUTH0_USER_ID?.trim() || 'auth0|local-demo-01';
const primaryDemoEmail =
  process.env.WODLY_DEMO_EMAIL?.trim() || 'athlete01@wodly.local';

const firstNames = [
  'Sofia',
  'Mateo',
  'Camila',
  'Lucas',
  'Valentina',
  'Thiago',
  'Martina',
  'Gabriel',
  'Lucia',
  'Nicolas',
  'Renata',
  'Joaquin',
  'Paula',
  'Bruno',
  'Elena',
  'Rafael',
  'Ana',
  'Diego',
  'Marina',
  'Felipe',
  'Clara',
  'Tomas',
  'Julia',
  'Pedro',
  'Laura',
  'Miguel',
  'Isabela',
  'Andres',
  'Carolina',
  'Daniel',
] as const;

const lastNames = [
  'Benitez',
  'Silva',
  'Gonzalez',
  'Costa',
  'Martinez',
  'Souza',
] as const;

type DemoWorkout = {
  id: string;
  typeKey: 'FOR_TIME' | 'AMRAP' | 'STRENGTH' | 'MAX_REPS';
  resultTypeKey: 'TIME' | 'ROUNDS_REPS' | 'LOAD' | 'REPS';
  boxIndex: number;
  name: string;
  description: string;
  section: {
    rounds?: number;
    durationSeconds?: number;
    repScheme?: number[];
  };
  movements: Array<{
    name: string;
    reps?: number;
    distance?: number;
    percentage?: number;
    referenceRepMax?: number;
  }>;
};

const demoWorkouts: DemoWorkout[] = [
  {
    id: `${DEMO_PREFIX}workout_engine`,
    typeKey: 'FOR_TIME',
    resultTypeKey: 'TIME',
    boxIndex: 0,
    name: 'Demo Engine Builder',
    description:
      'Three rounds of running and burpees for a fast conditioning test.',
    section: { rounds: 3 },
    movements: [
      { name: 'Run', distance: 400 },
      { name: 'Burpee', reps: 12 },
    ],
  },
  {
    id: `${DEMO_PREFIX}workout_bodyweight`,
    typeKey: 'AMRAP',
    resultTypeKey: 'ROUNDS_REPS',
    boxIndex: 0,
    name: 'Demo Bodyweight Builder',
    description:
      'A twelve-minute AMRAP that develops sustainable gymnastics volume.',
    section: { durationSeconds: 720 },
    movements: [
      { name: 'Air Squat', reps: 15 },
      { name: 'Push-up', reps: 10 },
    ],
  },
  {
    id: `${DEMO_PREFIX}workout_strength`,
    typeKey: 'STRENGTH',
    resultTypeKey: 'LOAD',
    boxIndex: 1,
    name: 'Demo Back Squat Strength',
    description:
      'Five working sets of back squats with percentage-based loading.',
    section: { rounds: 5, repScheme: [5, 5, 5, 5, 5] },
    movements: [
      {
        name: 'Back Squat',
        reps: 5,
        percentage: 75,
        referenceRepMax: 1,
      },
    ],
  },
  {
    id: `${DEMO_PREFIX}workout_gymnastics`,
    typeKey: 'MAX_REPS',
    resultTypeKey: 'REPS',
    boxIndex: 1,
    name: 'Demo Strict Pull-up Test',
    description: 'One unbroken set to track strict pulling strength.',
    section: {},
    movements: [{ name: 'Strict Pull-up' }],
  },
];

function id(entity: string, index: number): string {
  return `${DEMO_PREFIX}${entity}_${String(index + 1).padStart(3, '0')}`;
}

function utcDay(offset: number, hour = 12): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offset,
      hour,
    ),
  );
}

function profileName(index: number): string {
  return `${firstNames[index]} ${lastNames[index % lastNames.length]}`;
}

function demoRole(index: number): UserRole {
  if (index === 0) return UserRole.ADMIN;
  if (index < 5) return UserRole.COACH;
  return UserRole.USER;
}

function boxIndexForUser(index: number): number {
  return index % 2;
}

function ownerUserIndexForBox(boxIndex: number): number {
  return boxIndex === 0 ? 2 : 1;
}

function primaryCoachIndexForBox(boxIndex: number): number {
  return boxIndex === 0 ? 1 : 0;
}

function boxIndexForCoach(coachIndex: number): number {
  return coachIndex % 2 === 0 ? 1 : 0;
}

async function deletePreviousDemoData(prisma: PrismaClient): Promise<void> {
  const demoId = { startsWith: DEMO_PREFIX };

  await prisma.$transaction([
    prisma.classBooking.deleteMany({ where: { id: demoId } }),
    prisma.classSession.deleteMany({ where: { id: demoId } }),
    prisma.programTemplateItem.deleteMany({ where: { id: demoId } }),
    prisma.programTemplate.deleteMany({ where: { id: demoId } }),
    prisma.coachGroupMember.deleteMany({ where: { id: demoId } }),
    prisma.coachGroup.deleteMany({ where: { id: demoId } }),
    prisma.coachAthleteRelationship.deleteMany({ where: { id: demoId } }),
    prisma.scheduledWorkout.deleteMany({ where: { id: demoId } }),
    prisma.workoutResultMovement.deleteMany({ where: { id: demoId } }),
    prisma.movementResult.deleteMany({ where: { id: demoId } }),
    prisma.workoutResult.deleteMany({ where: { id: demoId } }),
    prisma.workoutMovementPrescription.deleteMany({ where: { id: demoId } }),
    prisma.workout.deleteMany({ where: { id: demoId } }),
    prisma.movement.deleteMany({ where: { id: demoId } }),
    prisma.userRoleChange.deleteMany({ where: { id: demoId } }),
    prisma.notificationReceipt.deleteMany({ where: { id: demoId } }),
    prisma.notificationPreference.deleteMany({
      where: { userId: demoId },
    }),
    prisma.boxMembership.deleteMany({ where: { id: demoId } }),
    prisma.box.deleteMany({ where: { id: demoId } }),
    prisma.coachProfile.deleteMany({ where: { id: demoId } }),
    prisma.athleteProfile.deleteMany({ where: { id: demoId } }),
    prisma.user.deleteMany({ where: { id: demoId } }),
    prisma.systemCheck.deleteMany({ where: { id: demoId } }),
  ]);
}

export async function seedLocalDemoData(prisma: PrismaClient): Promise<void> {
  console.log('  • Replacing local demo data...');
  await deletePreviousDemoData(prisma);

  const createdAt = utcDay(-ACCOUNT_AGE_DAYS, 9);
  const levels = new Map(
    (await prisma.workoutLevel.findMany()).map((item) => [item.key, item.id]),
  );
  const categories = new Map(
    (await prisma.prescriptionCategory.findMany()).map((item) => [
      item.key,
      item.id,
    ]),
  );
  const workoutTypes = new Map(
    (await prisma.workoutType.findMany()).map((item) => [item.key, item.id]),
  );
  const resultTypes = new Map(
    (await prisma.resultType.findMany()).map((item) => [item.key, item.id]),
  );
  const measurementTypes = new Map(
    (await prisma.measurementType.findMany()).map((item) => [
      item.key,
      item.id,
    ]),
  );
  const movements = new Map(
    (await prisma.movement.findMany()).map((item) => [item.name, item]),
  );

  const users: Prisma.UserCreateManyInput[] = Array.from(
    { length: USER_COUNT },
    (_, index) => ({
      id: id('user', index),
      auth0UserId:
        index === 0
          ? primaryDemoAuth0UserId
          : `auth0|local-demo-${String(index + 1).padStart(2, '0')}`,
      email:
        index === 0
          ? primaryDemoEmail
          : `athlete${String(index + 1).padStart(2, '0')}@wodly.local`,
      role: demoRole(index),
      createdAt,
      updatedAt: utcDay(-1, 18),
    }),
  );
  await prisma.user.createMany({ data: users });

  const boxes: Prisma.BoxCreateManyInput[] = [
    {
      id: id('box', 0),
      name: 'Wodly Downtown Demo',
      description:
        'A busy affiliate used to preview athlete and class workflows.',
      timezone: 'America/Asuncion',
      joinCode: 'DEMO-DOWNTOWN',
      ownerUserId: id('user', ownerUserIndexForBox(0)),
      createdAt,
      updatedAt: utcDay(-1),
    },
    {
      id: id('box', 1),
      name: 'Wodly Riverside Demo',
      description:
        'A second affiliate for testing tenant and catalog separation.',
      timezone: 'America/Asuncion',
      joinCode: 'DEMO-RIVERSIDE',
      ownerUserId: id('user', ownerUserIndexForBox(1)),
      createdAt,
      updatedAt: utcDay(-1),
    },
  ];
  await prisma.box.createMany({ data: boxes });

  const memberships: Prisma.BoxMembershipCreateManyInput[] = users.map(
    (_, index) => ({
      id: id('membership', index),
      boxId: id('box', boxIndexForUser(index)),
      userId: id('user', index),
      role:
        index === 1 || index === 2
          ? BoxMemberRole.OWNER
          : index < 5
            ? BoxMemberRole.COACH
            : BoxMemberRole.ATHLETE,
      createdAt,
      updatedAt: utcDay(-1),
    }),
  );
  await prisma.boxMembership.createMany({ data: memberships });
  for (let index = 0; index < USER_COUNT; index += 1) {
    await prisma.user.update({
      where: { id: id('user', index) },
      data: { activeBoxId: id('box', boxIndexForUser(index)) },
    });
  }

  const profiles: Prisma.AthleteProfileCreateManyInput[] = users.map(
    (_, index) => ({
      id: id('athlete', index),
      userId: id('user', index),
      displayName: profileName(index),
      leaderboardEnabled: index % 4 !== 0,
      preferredWeightUnit: index % 5 === 0 ? WeightUnit.LB : WeightUnit.KG,
      bio: `Training consistently with Wodly for ${ACCOUNT_AGE_DAYS} days.`,
      trainingGoals:
        index % 3 === 0
          ? [AthleteTrainingGoal.STRENGTH, AthleteTrainingGoal.COMPETITION]
          : index % 3 === 1
            ? [
                AthleteTrainingGoal.GENERAL_FITNESS,
                AthleteTrainingGoal.CONDITIONING,
              ]
            : [
                AthleteTrainingGoal.GYMNASTICS,
                AthleteTrainingGoal.WEIGHTLIFTING,
              ],
      weeklyTrainingTarget: 3 + (index % 4),
      loadRoundingIncrement: 0.5,
      preferredWorkoutLevelId: requireId(
        levels,
        index % 5 === 0 ? 'BEGINNER' : index % 3 === 0 ? 'RX' : 'INTERMEDIATE',
        'Workout level',
      ),
      preferredPrescriptionCategoryId: requireId(
        categories,
        index % 2 === 0 ? 'WOMEN' : 'MEN',
        'Prescription category',
      ),
      createdAt,
      updatedAt: utcDay(-1),
    }),
  );
  await prisma.athleteProfile.createMany({ data: profiles });

  const coachIndexes = [1, 2, 3, 4];
  await prisma.coachProfile.createMany({
    data: coachIndexes.map((userIndex, index) => ({
      id: id('coach', index),
      userId: id('user', userIndex),
      displayName: `Coach ${profileName(userIndex)}`,
      bio: 'Demo coach focused on consistent progress, clear feedback, and sustainable training.',
      createdAt,
      updatedAt: utcDay(-1),
    })),
  });

  await prisma.notificationPreference.createMany({
    data: users.map((_, index) => ({
      userId: id('user', index),
      workoutReminders: index % 6 !== 0,
      coachUpdates: true,
      reminderLeadDays: index % 3,
      createdAt,
      updatedAt: utcDay(-2),
    })),
  });

  await prisma.userRoleChange.createMany({
    data: coachIndexes.map((userIndex, index) => ({
      id: id('role_change', index),
      userId: id('user', userIndex),
      previousRole: UserRole.USER,
      newRole: UserRole.COACH,
      changedById: id('user', 0),
      createdAt: utcDay(-110 + index),
    })),
  });

  const personalMovements: Prisma.MovementCreateManyInput[] = Array.from(
    { length: 6 },
    (_, index) => {
      const name = `Demo Skill Drill ${index + 1}`;
      return {
        id: id('movement', index),
        name,
        searchText: buildMovementSearchText(name, [`Demo drill ${index + 1}`]),
        categoryId: movements.get(index % 2 === 0 ? 'Strict Pull-up' : 'Row')!
          .categoryId,
        official: false,
        isFoundational: false,
        aliases: [`Demo drill ${index + 1}`],
        description:
          'A personal demo movement used to preview custom movement management.',
        scope: MovementScope.PERSONAL,
        createdByUserId: id('user', index + 5),
        createdAt: utcDay(-80 + index),
        updatedAt: utcDay(-10 + index),
      };
    },
  );
  await prisma.movement.createMany({ data: personalMovements });
  await prisma.movementMeasurementType.createMany({
    data: personalMovements.map((movement) => ({
      movementId: movement.id!,
      measurementTypeId: requireId(
        measurementTypes,
        'REPS',
        'Measurement type',
      ),
    })),
  });

  await createDemoWorkouts(prisma, {
    categories,
    levels,
    movements,
    workoutTypes,
  });

  const relationships: Prisma.CoachAthleteRelationshipCreateManyInput[] = [];
  for (let athleteIndex = 5; athleteIndex < USER_COUNT; athleteIndex += 1) {
    const boxIndex = boxIndexForUser(athleteIndex);
    const coachIndex =
      boxIndex === 0
        ? athleteIndex % 4 === 0
          ? 3
          : 1
        : athleteIndex % 4 === 1
          ? 2
          : 0;
    relationships.push({
      id: id('relationship', relationships.length),
      coachProfileId: id('coach', coachIndex),
      athleteProfileId: id('athlete', athleteIndex),
      boxId: id('box', boxIndex),
      status:
        athleteIndex === USER_COUNT - 1
          ? CoachAthleteStatus.PENDING
          : CoachAthleteStatus.ACTIVE,
      createdAt: utcDay(-100 + (athleteIndex % 10)),
      updatedAt: utcDay(-1),
    });
  }
  await prisma.coachAthleteRelationship.createMany({ data: relationships });

  const groups: Prisma.CoachGroupCreateManyInput[] = coachIndexes.map(
    (_, index) => ({
      id: id('group', index),
      coachProfileId: id('coach', index),
      boxId: id('box', boxIndexForCoach(index)),
      name: index % 2 === 0 ? 'Competition Track' : 'Foundations Track',
      description:
        'A demo training group with athletes at similar goals and experience.',
      createdAt: utcDay(-95),
      updatedAt: utcDay(-2),
    }),
  );
  await prisma.coachGroup.createMany({ data: groups });
  await prisma.coachGroupMember.createMany({
    data: relationships
      .filter(
        (relationship) => relationship.status === CoachAthleteStatus.ACTIVE,
      )
      .map((relationship, index) => ({
        id: id('group_member', index),
        groupId: id(
          'group',
          Number(relationship.coachProfileId.split('_').at(-1)) - 1,
        ),
        athleteProfileId: relationship.athleteProfileId,
        createdAt: utcDay(-85 + (index % 8)),
      })),
  });

  await createProgramTemplates(prisma, categories);
  const activity = await createNinetyDayActivity(prisma, {
    categories,
    measurementTypes,
    movements,
    resultTypes,
  });
  const classCount = await createClasses(prisma);
  await createNotifications(prisma);
  await prisma.systemCheck.create({
    data: { id: `${DEMO_PREFIX}system_check`, createdAt: utcDay(0) },
  });

  console.log(`    ✓ ${USER_COUNT} users and athlete profiles seeded`);
  console.log(
    `    ✓ ${activity.workoutResults} workout results across ${HISTORY_DAYS} days seeded`,
  );
  console.log(`    ✓ ${activity.movementResults} movement results seeded`);
  console.log(`    ✓ ${activity.scheduledWorkouts} scheduled workouts seeded`);
  console.log(`    ✓ ${classCount} historical and upcoming classes seeded`);
  console.log(
    `    ℹ Primary demo identity: ${primaryDemoAuth0UserId} (${primaryDemoEmail})`,
  );
  console.log('    ℹ Remaining identities: auth0|local-demo-02 through -30');
}

async function createDemoWorkouts(
  prisma: PrismaClient,
  references: {
    categories: Map<string, string>;
    levels: Map<string, string>;
    movements: Map<string, { id: string; categoryId: string }>;
    workoutTypes: Map<string, string>;
  },
): Promise<void> {
  for (const [workoutIndex, workoutSeed] of demoWorkouts.entries()) {
    await prisma.workout.create({
      data: {
        id: workoutSeed.id,
        name: workoutSeed.name,
        description: workoutSeed.description,
        typeId: requireId(
          references.workoutTypes,
          workoutSeed.typeKey,
          'Workout type',
        ),
        createdByUserId: id('user', ownerUserIndexForBox(workoutSeed.boxIndex)),
        scope: WorkoutScope.BOX,
        boxId: id('box', workoutSeed.boxIndex),
        createdAt: utcDay(-115 + workoutIndex),
        updatedAt: utcDay(-3),
      },
    });

    for (const [levelIndex, levelKey] of [
      'RX',
      'INTERMEDIATE',
      'BEGINNER',
    ].entries()) {
      const variantId = `${workoutSeed.id}_variant_${levelKey.toLowerCase()}`;
      const sectionId = `${variantId}_section`;
      await prisma.workoutVariant.create({
        data: {
          id: variantId,
          workoutId: workoutSeed.id,
          levelId: requireId(references.levels, levelKey, 'Workout level'),
          name:
            levelKey === 'RX'
              ? 'As prescribed'
              : `${levelKey.toLowerCase()} option`,
          notes:
            levelKey === 'RX'
              ? null
              : 'Reduced volume or loading while preserving the intended stimulus.',
          createdAt: utcDay(-115 + workoutIndex),
          updatedAt: utcDay(-3),
        },
      });
      await prisma.workoutSection.create({
        data: {
          id: sectionId,
          variantId,
          typeId: requireId(
            references.workoutTypes,
            workoutSeed.typeKey,
            'Workout type',
          ),
          order: 0,
          rounds: workoutSeed.section.rounds,
          durationSeconds: workoutSeed.section.durationSeconds,
          repScheme: workoutSeed.section.repScheme ?? [],
          notes:
            levelKey === 'BEGINNER'
              ? 'Move steadily and prioritize quality.'
              : null,
          createdAt: utcDay(-115 + workoutIndex),
          updatedAt: utcDay(-3),
        },
      });

      for (const [
        movementIndex,
        movementSeed,
      ] of workoutSeed.movements.entries()) {
        const movement = references.movements.get(movementSeed.name);
        if (!movement)
          throw new Error(`Movement "${movementSeed.name}" was not found.`);
        const volumeFactor =
          levelIndex === 0 ? 1 : levelIndex === 1 ? 0.8 : 0.6;
        const workoutMovementId = `${sectionId}_movement_${movementIndex + 1}`;
        await prisma.workoutMovement.create({
          data: {
            id: workoutMovementId,
            sectionId,
            movementId: movement.id,
            order: movementIndex,
            reps: movementSeed.reps
              ? Math.max(1, Math.round(movementSeed.reps * volumeFactor))
              : undefined,
            distance: movementSeed.distance
              ? Math.round(movementSeed.distance * volumeFactor)
              : undefined,
            percentage: movementSeed.percentage
              ? movementSeed.percentage - levelIndex * 10
              : undefined,
            referenceRepMax: movementSeed.referenceRepMax,
            createdAt: utcDay(-115 + workoutIndex),
            updatedAt: utcDay(-3),
          },
        });

        for (const [categoryIndex, categoryKey] of ['MEN', 'WOMEN'].entries()) {
          await prisma.workoutMovementPrescription.create({
            data: {
              id: `${workoutMovementId}_prescription_${categoryKey.toLowerCase()}`,
              workoutMovementId,
              prescriptionCategoryId: requireId(
                references.categories,
                categoryKey,
                'Prescription category',
              ),
              reps: movementSeed.reps
                ? Math.max(1, Math.round(movementSeed.reps * volumeFactor))
                : undefined,
              percentage: movementSeed.percentage
                ? movementSeed.percentage - levelIndex * 10
                : undefined,
              referenceRepMax: movementSeed.referenceRepMax,
              referenceMovementId: movementSeed.percentage
                ? movement.id
                : undefined,
              distance: movementSeed.distance
                ? Math.round(movementSeed.distance * volumeFactor)
                : undefined,
              notes:
                categoryIndex === 0
                  ? 'Men demo prescription'
                  : 'Women demo prescription',
              createdAt: utcDay(-115 + workoutIndex),
              updatedAt: utcDay(-3),
            },
          });
        }
      }
    }
  }
}

async function createProgramTemplates(
  prisma: PrismaClient,
  categories: Map<string, string>,
): Promise<void> {
  for (let index = 0; index < 4; index += 1) {
    const templateId = id('template', index);
    const coachBoxIndex = boxIndexForCoach(index);
    const workout = demoWorkouts.filter(
      (item) => item.boxIndex === coachBoxIndex,
    )[index % 2];
    await prisma.programTemplate.create({
      data: {
        id: templateId,
        coachProfileId: id('coach', index),
        boxId: id('box', coachBoxIndex),
        name:
          index % 2 === 0
            ? 'Four-week performance block'
            : 'Four-week foundations block',
        description:
          'Reusable demo programming with workout, level, and prescription selections.',
        createdAt: utcDay(-75),
        updatedAt: utcDay(-5),
      },
    });
    for (let dayOffset = 0; dayOffset < 4; dayOffset += 1) {
      const levelKey =
        dayOffset % 3 === 0
          ? 'rx'
          : dayOffset % 3 === 1
            ? 'intermediate'
            : 'beginner';
      await prisma.programTemplateItem.create({
        data: {
          id: `${templateId}_item_${dayOffset + 1}`,
          programTemplateId: templateId,
          dayOffset: dayOffset * 2,
          workoutId: workout.id,
          workoutVariantId: `${workout.id}_variant_${levelKey}`,
          prescriptionCategoryId: requireId(
            categories,
            index % 2 === 0 ? 'WOMEN' : 'MEN',
            'Prescription category',
          ),
          coachNotes: 'Adjust the pace while preserving movement quality.',
          sortOrder: dayOffset,
          createdAt: utcDay(-75),
          updatedAt: utcDay(-5),
        },
      });
    }
  }
}

async function createNinetyDayActivity(
  prisma: PrismaClient,
  references: {
    categories: Map<string, string>;
    measurementTypes: Map<string, string>;
    movements: Map<string, { id: string }>;
    resultTypes: Map<string, string>;
  },
): Promise<{
  workoutResults: number;
  movementResults: number;
  scheduledWorkouts: number;
}> {
  const workoutResults: Prisma.WorkoutResultCreateManyInput[] = [];
  const performedMovements: Prisma.WorkoutResultMovementCreateManyInput[] = [];
  const movementResults: Prisma.MovementResultCreateManyInput[] = [];
  const scheduledWorkouts: Prisma.ScheduledWorkoutCreateManyInput[] = [];
  let resultCounter = 0;
  let movementResultCounter = 0;
  let scheduledCounter = 0;

  for (let userIndex = 0; userIndex < USER_COUNT; userIndex += 1) {
    const userBox = boxIndexForUser(userIndex);
    const availableWorkouts = demoWorkouts.filter(
      (workout) => workout.boxIndex === userBox,
    );
    for (let dayOffset = -HISTORY_DAYS; dayOffset <= -1; dayOffset += 3) {
      const workoutSeed =
        availableWorkouts[
          (Math.abs(dayOffset) + userIndex) % availableWorkouts.length
        ];
      const levelKey =
        userIndex % 5 === 0
          ? 'beginner'
          : userIndex % 3 === 0
            ? 'rx'
            : 'intermediate';
      const variantId = `${workoutSeed.id}_variant_${levelKey}`;
      const categoryKey = userIndex % 2 === 0 ? 'WOMEN' : 'MEN';
      const workoutResultId = id('workout_result', resultCounter);
      const performedAt = utcDay(dayOffset, 17 + (userIndex % 3));
      const progress = HISTORY_DAYS + dayOffset;
      const resultData: Prisma.WorkoutResultCreateManyInput = {
        id: workoutResultId,
        workoutId: workoutSeed.id,
        workoutVariantId: variantId,
        prescriptionCategoryId: requireId(
          references.categories,
          categoryKey,
          'Prescription category',
        ),
        athleteProfileId: id('athlete', userIndex),
        resultTypeId: requireId(
          references.resultTypes,
          workoutSeed.resultTypeKey,
          'Result type',
        ),
        performedAt,
        notes:
          resultCounter % 11 === 0
            ? 'Felt strong and kept a consistent pace.'
            : null,
        createdAt: performedAt,
        updatedAt: performedAt,
      };
      if (workoutSeed.resultTypeKey === 'TIME')
        resultData.timeSeconds = Math.max(
          420,
          980 - progress * 2 - userIndex * 3,
        );
      if (workoutSeed.resultTypeKey === 'ROUNDS_REPS') {
        resultData.rounds = 5 + Math.floor(progress / 24) + (userIndex % 3);
        resultData.reps = (progress + userIndex * 3) % 25;
      }
      if (workoutSeed.resultTypeKey === 'LOAD') {
        resultData.load = 55 + userIndex * 1.5 + progress * 0.25;
        resultData.weightUnit = WeightUnit.KG;
      }
      if (workoutSeed.resultTypeKey === 'REPS')
        resultData.reps = 4 + (userIndex % 10) + Math.floor(progress / 24);
      workoutResults.push(resultData);

      for (const [
        movementIndex,
        movementSeed,
      ] of workoutSeed.movements.entries()) {
        const workoutMovementId = `${variantId}_section_movement_${movementIndex + 1}`;
        const resultMovementId = id('result_movement', movementResultCounter);
        const movement = references.movements.get(movementSeed.name)!;
        const performedData: Prisma.WorkoutResultMovementCreateManyInput = {
          id: resultMovementId,
          workoutResultId,
          workoutMovementId,
          workoutMovementPrescriptionId: `${workoutMovementId}_prescription_${categoryKey.toLowerCase()}`,
          prescribedPercentage: movementSeed.percentage,
          referenceRepMax: movementSeed.referenceRepMax,
          referenceLoad: movementSeed.percentage
            ? 80 + userIndex * 2
            : undefined,
          referenceWeightUnit: movementSeed.percentage
            ? WeightUnit.KG
            : undefined,
          targetLoad: movementSeed.percentage
            ? 60 + userIndex * 1.5
            : undefined,
          targetWeightUnit: movementSeed.percentage ? WeightUnit.KG : undefined,
          reps:
            movementSeed.reps ??
            (workoutSeed.resultTypeKey === 'REPS'
              ? resultData.reps
              : undefined),
          distance: movementSeed.distance,
          load:
            workoutSeed.resultTypeKey === 'LOAD' ? resultData.load : undefined,
          weightUnit:
            workoutSeed.resultTypeKey === 'LOAD' ? WeightUnit.KG : undefined,
          durationSeconds: movementSeed.distance
            ? Math.max(70, 130 - Math.floor(progress / 4))
            : undefined,
          createdAt: performedAt,
          updatedAt: performedAt,
        };
        performedMovements.push(performedData);

        const measurementKey =
          workoutSeed.resultTypeKey === 'LOAD'
            ? 'WEIGHT'
            : movementSeed.distance
              ? 'DURATION'
              : 'REPS';
        movementResults.push({
          id: id('movement_result', movementResultCounter),
          movementId: movement.id,
          athleteProfileId: id('athlete', userIndex),
          measurementTypeId: requireId(
            references.measurementTypes,
            measurementKey,
            'Measurement type',
          ),
          sourceWorkoutResultId: workoutResultId,
          performedAt,
          reps:
            measurementKey === 'REPS'
              ? (performedData.reps ?? resultData.reps ?? 10)
              : undefined,
          load: measurementKey === 'WEIGHT' ? resultData.load : undefined,
          weightUnit: measurementKey === 'WEIGHT' ? WeightUnit.KG : undefined,
          durationSeconds:
            measurementKey === 'DURATION'
              ? performedData.durationSeconds
              : undefined,
          createdAt: performedAt,
          updatedAt: performedAt,
        });
        movementResultCounter += 1;
      }

      scheduledWorkouts.push({
        id: id('scheduled', scheduledCounter),
        athleteProfileId: id('athlete', userIndex),
        boxId: id('box', userBox),
        workoutId: workoutSeed.id,
        workoutVariantId: variantId,
        prescriptionCategoryId: requireId(
          references.categories,
          categoryKey,
          'Prescription category',
        ),
        workoutResultId,
        scheduledDate: utcDay(dayOffset, 0),
        status: ScheduledWorkoutStatus.COMPLETED,
        completedAt: performedAt,
        assignedByCoachProfileId: id('coach', primaryCoachIndexForBox(userBox)),
        coachNotes:
          resultCounter % 7 === 0
            ? 'Stay controlled in the opening rounds.'
            : null,
        athleteComment:
          resultCounter % 9 === 0 ? 'Completed as planned.' : null,
        athleteCommentedAt: resultCounter % 9 === 0 ? performedAt : null,
        coachFeedback:
          resultCounter % 8 === 0
            ? 'Good pacing. Add a small progression next time.'
            : null,
        reviewedAt: resultCounter % 8 === 0 ? utcDay(dayOffset + 1, 10) : null,
        createdAt: utcDay(dayOffset - 2, 10),
        updatedAt: performedAt,
      });
      resultCounter += 1;
      scheduledCounter += 1;
    }

    for (let futureIndex = 0; futureIndex <= 4; futureIndex += 1) {
      const workoutSeed =
        availableWorkouts[(futureIndex + userIndex) % availableWorkouts.length];
      const levelKey =
        userIndex % 5 === 0
          ? 'beginner'
          : userIndex % 3 === 0
            ? 'rx'
            : 'intermediate';
      scheduledWorkouts.push({
        id: id('scheduled', scheduledCounter),
        athleteProfileId: id('athlete', userIndex),
        boxId: id('box', userBox),
        workoutId: workoutSeed.id,
        workoutVariantId: `${workoutSeed.id}_variant_${levelKey}`,
        prescriptionCategoryId: requireId(
          references.categories,
          userIndex % 2 === 0 ? 'WOMEN' : 'MEN',
          'Prescription category',
        ),
        scheduledDate: utcDay(futureIndex === 0 ? -1 : futureIndex * 2, 0),
        status: ScheduledWorkoutStatus.PLANNED,
        assignedByCoachProfileId: id('coach', primaryCoachIndexForBox(userBox)),
        coachNotes:
          futureIndex === 1
            ? 'Review the movement standards before starting.'
            : null,
        createdAt: utcDay(-2),
        updatedAt: utcDay(-1),
      });
      scheduledCounter += 1;
    }
  }

  await prisma.workoutResult.createMany({ data: workoutResults });
  await prisma.workoutResultMovement.createMany({ data: performedMovements });
  await prisma.movementResult.createMany({ data: movementResults });
  await prisma.scheduledWorkout.createMany({ data: scheduledWorkouts });

  return {
    workoutResults: workoutResults.length,
    movementResults: movementResults.length,
    scheduledWorkouts: scheduledWorkouts.length,
  };
}

async function createClasses(prisma: PrismaClient): Promise<number> {
  const classes: Prisma.ClassSessionCreateManyInput[] = [];
  const bookings: Prisma.ClassBookingCreateManyInput[] = [];
  let classCounter = 0;
  let bookingCounter = 0;
  for (let dayOffset = -HISTORY_DAYS; dayOffset <= 14; dayOffset += 1) {
    const day = utcDay(dayOffset);
    const weekday = day.getUTCDay();
    if (weekday === 0) continue;
    for (let boxIndex = 0; boxIndex < 2; boxIndex += 1) {
      const workout = demoWorkouts.filter((item) => item.boxIndex === boxIndex)[
        Math.abs(dayOffset) % 2
      ];
      const classId = id('class', classCounter);
      const startsAt = utcDay(dayOffset, dayOffset % 2 === 0 ? 9 : 18);
      classes.push({
        id: classId,
        boxId: id('box', boxIndex),
        name: dayOffset % 2 === 0 ? 'Morning CrossFit' : 'Evening CrossFit',
        description:
          'Coach-led demo class with a programmed workout and realistic attendance.',
        startsAt,
        durationMinutes: 60,
        capacity: 12,
        workoutId: workout.id,
        workoutVariantId: `${workout.id}_variant_intermediate`,
        createdByUserId: id('user', ownerUserIndexForBox(boxIndex)),
        createdAt: utcDay(dayOffset - 7),
        updatedAt: utcDay(Math.min(dayOffset, -1)),
      });

      const athletesInBox = Array.from(
        { length: USER_COUNT },
        (_, index) => index,
      ).filter((index) => boxIndexForUser(index) === boxIndex);
      for (let position = 0; position < 9; position += 1) {
        const userIndex =
          athletesInBox[
            (position + Math.abs(dayOffset)) % athletesInBox.length
          ];
        bookings.push({
          id: id('booking', bookingCounter),
          classId,
          userId: id('user', userIndex),
          status:
            dayOffset >= 0
              ? ClassBookingStatus.BOOKED
              : position === 8 && dayOffset % 5 === 0
                ? ClassBookingStatus.CANCELLED
                : ClassBookingStatus.ATTENDED,
          createdAt: utcDay(dayOffset - 3),
          updatedAt: dayOffset < 0 ? startsAt : utcDay(-1),
        });
        bookingCounter += 1;
      }
      classCounter += 1;
    }
  }
  await prisma.classSession.createMany({ data: classes });
  await prisma.classBooking.createMany({ data: bookings });
  return classes.length;
}

async function createNotifications(prisma: PrismaClient): Promise<void> {
  const receipts: Prisma.NotificationReceiptCreateManyInput[] = [];
  for (let userIndex = 0; userIndex < USER_COUNT; userIndex += 1) {
    const userId = id('user', userIndex);
    const planned = await prisma.scheduledWorkout.findMany({
      where: {
        athleteProfileId: id('athlete', userIndex),
        status: ScheduledWorkoutStatus.PLANNED,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 2,
    });
    for (const [index, scheduled] of planned.entries()) {
      receipts.push({
        id: id('notification', receipts.length),
        userId,
        notificationKey: `${scheduled.scheduledDate < utcDay(0, 0) ? 'overdue' : 'upcoming'}:${scheduled.id}`,
        readAt: index === 0 && userIndex % 3 === 0 ? utcDay(-1) : null,
        dismissedAt: index === 1 && userIndex % 5 === 0 ? utcDay(-1) : null,
        createdAt: utcDay(-2),
        updatedAt: utcDay(-1),
      });
    }

    const pendingRelationship = await prisma.coachAthleteRelationship.findFirst(
      {
        where: {
          athleteProfileId: id('athlete', userIndex),
          status: CoachAthleteStatus.PENDING,
        },
      },
    );
    if (pendingRelationship) {
      receipts.push({
        id: id('notification', receipts.length),
        userId,
        notificationKey: `coach-invitation:${pendingRelationship.id}`,
        createdAt: pendingRelationship.createdAt,
        updatedAt: pendingRelationship.createdAt,
      });
    }
  }
  await prisma.notificationReceipt.createMany({ data: receipts });
}
