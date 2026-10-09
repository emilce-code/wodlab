import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

// Real HTTP, membership authorization, scheduling constraints and PostgreSQL.
// Synthetic authentication replaces only the JWT boundary.
describe('Schedule Class v2 (database e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const prefix = `schedule-v2-${randomUUID()}`;
  const id = (key: string) => `${prefix}-${key}`;
  const actors = [
    'owner',
    'coach',
    'athlete',
    'second',
    'pending',
    'outsider',
    'admin',
  ] as const;
  type Actor = (typeof actors)[number];
  const payload = {
    name: 'Morning training',
    startsAt: '2099-10-10T12:00:00.000Z',
    durationMinutes: 60,
    capacity: 12,
  };
  const create = (actor: Actor, body: object = payload, box = 'box') =>
    request(app.getHttpServer())
      .post(`/boxes/${id(box)}/classes`)
      .set('x-test-actor', actor)
      .send(body);

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<{ headers: Record<string, string>; user?: unknown }>();
          const actor = req.headers['x-test-actor'] as Actor;
          req.user = {
            userId: id(actor),
            role: actor === 'admin' ? 'ADMIN' : 'USER',
            permissions: [],
          };
          return actors.includes(actor);
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.createMany({
      data: actors.map((actor) => ({
        id: id(actor),
        auth0UserId: id(actor),
        email: `${id(actor)}@example.com`,
        role: actor === 'admin' ? 'ADMIN' : 'USER',
      })),
    });
    await prisma.box.create({
      data: {
        id: id('box'),
        name: 'Classes Test Box',
        ownerUserId: id('owner'),
        joinCode: randomUUID(),
        memberships: {
          create: actors
            .filter((a) => !['outsider', 'admin'].includes(a))
            .map((actor) => ({
              userId: id(actor),
              roleId: `box-membership-role-${actor === 'owner' ? 'owner' : actor === 'coach' ? 'coach' : 'athlete'}`,
              status: actor === 'pending' ? 'PENDING' : 'ACTIVE',
            })),
        },
      },
    });
    await prisma.box.create({
      data: {
        id: id('other-box'),
        name: 'Other Box',
        ownerUserId: id('outsider'),
        joinCode: randomUUID(),
      },
    });
    await prisma.workoutType.create({
      data: { id: id('type'), key: id('type'), name: 'For Time' },
    });
    await prisma.workoutLevel.create({
      data: { id: id('level'), key: id('level'), name: 'Test Rx' },
    });
    for (const key of ['global', 'local', 'foreign', 'personal', 'inactive']) {
      await prisma.workout.create({
        data: {
          id: id(key),
          name: `Test ${key}`,
          typeId: id('type'),
          createdByUserId: id('owner'),
          scope:
            key === 'global'
              ? 'GLOBAL'
              : key === 'personal'
                ? 'PERSONAL'
                : 'BOX',
          boxId:
            key === 'foreign'
              ? id('other-box')
              : ['local', 'inactive'].includes(key)
                ? id('box')
                : null,
          isActive: key !== 'inactive',
          variants: {
            create: { id: id(key + '-variant'), levelId: id('level') },
          },
        },
      });
    }
  }, 30000);
  afterAll(async () => {
    if (prisma) {
      await prisma.classSession.deleteMany({
        where: { boxId: { in: [id('box'), id('other-box')] } },
      });
      await prisma.workout.deleteMany({
        where: {
          id: {
            in: ['global', 'local', 'foreign', 'personal', 'inactive'].map(id),
          },
        },
      });
      await prisma.box.deleteMany({
        where: { id: { in: [id('box'), id('other-box')] } },
      });
      await prisma.workoutLevel.deleteMany({ where: { id: id('level') } });
      await prisma.workoutType.deleteMany({ where: { id: id('type') } });
      await prisma.user.deleteMany({ where: { id: { in: actors.map(id) } } });
    }
    await app?.close();
  });
  it.each(['owner', 'coach'] as const)(
    'lets %s schedule without optional fields',
    async (actor) => {
      const response = await create(actor).expect(201);
      expect(response.body).toMatchObject({
        name: payload.name,
        boxId: id('box'),
        durationMinutes: 60,
        capacity: 12,
        description: null,
        workout: null,
        workoutVariant: null,
        createdByUserId: id(actor),
      });
    },
  );
  it.each(['athlete', 'pending', 'outsider'] as const)(
    'denies scheduling and picker catalog to %s',
    async (actor) => {
      await create(actor).expect(403);
      await request(app.getHttpServer())
        .get(`/boxes/${id('box')}/options`)
        .set('x-test-actor', actor)
        .expect(403);
    },
  );
  it('keeps the catalog box scoped and includes usable variation context', async () => {
    const response = await request(app.getHttpServer())
      .get(`/boxes/${id('box')}/options`)
      .set('x-test-actor', 'coach')
      .expect(200);
    const ours = (
      response.body as { id: string; variants: { id: string }[] }[]
    ).filter((w) => w.id.startsWith(prefix));
    expect(ours.map((w) => w.id).sort()).toEqual(
      [id('global'), id('local')].sort(),
    );
    expect(ours.find((w) => w.id === id('local'))?.variants).toEqual([
      expect.objectContaining({
        id: id('local-variant'),
        level: { key: id('level'), name: 'Test Rx' },
      }),
    ]);
  });
  it('saves a workout, its matching variation and optional notes', async () => {
    const response = await create('coach', {
      ...payload,
      workoutId: id('local'),
      workoutVariantId: id('local-variant'),
      description: '  Bring shoes  ',
    }).expect(201);
    expect(response.body).toMatchObject({
      boxId: id('box'),
      description: 'Bring shoes',
      workout: { id: id('local') },
      workoutVariant: { id: id('local-variant') },
    });
  });
  it.each(['foreign', 'personal', 'inactive'])(
    'rejects %s workouts',
    async (key) => {
      await create('owner', { ...payload, workoutId: id(key) }).expect(400);
    },
  );
  it('rejects stale and unassigned variations', async () => {
    await create('owner', {
      ...payload,
      workoutId: id('local'),
      workoutVariantId: id('global-variant'),
    }).expect(400);
    await create('owner', {
      ...payload,
      workoutVariantId: id('local-variant'),
    }).expect(400);
  });
  it('enforces membership in the target box', async () => {
    await create('coach', payload, 'other-box').expect(403);
  });
  it.each([
    { name: 'A' },
    { name: 'A'.repeat(81) },
    { durationMinutes: 14 },
    { durationMinutes: 241 },
    { durationMinutes: 60.5 },
    { capacity: 0 },
    { capacity: 201 },
    { description: 'A'.repeat(501) },
    { startsAt: '2020-01-01T00:00:00.000Z' },
  ])(
    'preserves existing DTO and future-date constraints: %j',
    async (override) => {
      await create('coach', { ...payload, ...override }).expect(400);
    },
  );
});
