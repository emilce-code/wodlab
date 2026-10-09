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

// Real HTTP, membership authorization, capacity transactions and PostgreSQL.
// Synthetic authentication replaces only the JWT boundary.
describe('Class Management and Attendance v3 (database e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const prefix = `classes-v3-${randomUUID()}`;
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
  const detail = (actor: Actor, key = 'class', box = 'box') =>
    request(app.getHttpServer())
      .get(`/boxes/${id(box)}/classes/${id(key)}`)
      .set('x-test-actor', actor);
  const edit = (actor: Actor, body: object, key = 'class', box = 'box') =>
    request(app.getHttpServer())
      .patch(`/boxes/${id(box)}/classes/${id(key)}`)
      .set('x-test-actor', actor)
      .send(body);
  const attendance = (
    actor: Actor,
    status: string,
    athlete = 'athlete',
    key = 'class',
    box = 'box',
  ) =>
    request(app.getHttpServer())
      .patch(`/boxes/${id(box)}/classes/${id(key)}/attendance`)
      .set('x-test-actor', actor)
      .send({ userId: id(athlete), status });
  const remove = (actor: Actor, key = 'class') =>
    request(app.getHttpServer())
      .delete(`/boxes/${id('box')}/classes/${id(key)}`)
      .set('x-test-actor', actor);
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
    await prisma.classSession.createMany({
      data: ['class', 'attended', 'past', 'foreign', 'empty'].map((key) => ({
        id: id(key),
        boxId: id(key === 'foreign' ? 'other-box' : 'box'),
        name: key,
        startsAt: new Date(Date.now() + (key === 'past' ? -3600000 : 86400000)),
        durationMinutes: 60,
        capacity: 12,
        createdByUserId: id('owner'),
      })),
    });
    await prisma.classBooking.create({
      data: {
        classId: id('attended'),
        userId: id('athlete'),
        status: 'ATTENDED',
      },
    });
    await prisma.classBooking.createMany({
      data: [
        { classId: id('class'), userId: id('athlete'), status: 'BOOKED' },
        { classId: id('class'), userId: id('second'), status: 'BOOKED' },
        { classId: id('class'), userId: id('pending'), status: 'CANCELLED' },
      ],
    });
    await prisma.workoutType.create({
      data: { id: id('type'), key: id('type'), name: 'For Time' },
    });
    await prisma.workoutLevel.create({
      data: { id: id('level'), key: id('level'), name: 'Rx' },
    });
    for (const key of ['local', 'foreign-workout'])
      await prisma.workout.create({
        data: {
          id: id(key),
          name: key,
          typeId: id('type'),
          createdByUserId: id('owner'),
          scope: 'BOX',
          boxId: id(key === 'local' ? 'box' : 'other-box'),
          variants: {
            create: { id: id(key + '-variant'), levelId: id('level') },
          },
        },
      });
  }, 30000);
  afterAll(async () => {
    if (prisma) {
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
    'allows %s to change workout and notes with bookings',
    async (actor) => {
      await edit(actor, {
        workoutId: id('local'),
        workoutVariantId: id('local-variant'),
        description: ' Updated focus ',
      })
        .expect(200)
        .expect((response) => {
          expect(response.body).toMatchObject({
            description: 'Updated focus',
            workout: { id: id('local') },
            workoutVariant: { id: id('local-variant') },
          });
        });
    },
  );
  it('clears optional workout, variation and notes', async () => {
    await edit('coach', {
      workoutId: null,
      workoutVariantId: null,
      description: null,
    })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          workout: null,
          workoutVariant: null,
          description: null,
        });
      });
  });
  it.each(['owner', 'coach'] as const)(
    'independently rejects booked date/time edits for %s',
    async (actor) => {
      const before = await detail(actor).expect(200);
      await edit(actor, { startsAt: '2099-10-10T12:00:00.000Z' }).expect(409);
      const after = await detail(actor).expect(200);
      expect(after.body.startsAt).toBe(before.body.startsAt);
    },
  );
  it('allows valid date changes without bookings but rejects past dates', async () => {
    await edit(
      'coach',
      { startsAt: '2099-10-10T12:00:00.000Z' },
      'empty',
    ).expect(200);
    await edit(
      'coach',
      { startsAt: '2020-01-01T12:00:00.000Z' },
      'empty',
    ).expect(400);
    await edit(
      'coach',
      { description: 'Historical class notes' },
      'past',
    ).expect(200);
  });
  it.each([
    { capacity: 20 },
    { durationMinutes: 90 },
    { name: 'New name' },
    { description: 'X'.repeat(501) },
  ])('preserves restrictions for other fields', async (body) => {
    await edit('coach', body).expect(400);
  });
  it('rejects foreign and incompatible workout/variation assignments', async () => {
    await edit('coach', {
      workoutId: id('foreign-workout'),
      workoutVariantId: null,
    }).expect(400);
    await edit('coach', {
      workoutId: id('local'),
      workoutVariantId: id('foreign-workout-variant'),
    }).expect(400);
  });
  it.each(['athlete', 'pending', 'outsider'] as const)(
    'denies management mutations to %s',
    async (actor) => {
      await edit(actor, { description: 'Forbidden' }).expect(403);
      await attendance(actor, 'ATTENDED').expect(403);
      await remove(actor).expect(403);
    },
  );
  it('hides roster information from athlete class details and lists', async () => {
    await detail('athlete')
      .expect(200)
      .expect((response) => {
        expect(response.body.bookings).toEqual([]);
        expect(response.body.bookedCount).toBe(2);
        expect(response.body.currentUserBooking).toMatchObject({
          status: 'BOOKED',
        });
      });
    await request(app.getHttpServer())
      .get(`/boxes/${id('box')}/classes`)
      .set('x-test-actor', 'athlete')
      .expect(200)
      .expect((response) => {
        const selected = response.body.classes.find(
          (item: { id: string }) => item.id === id('class'),
        );
        expect(selected.bookings).toEqual([]);
        expect(selected.bookedCount).toBe(2);
        expect(selected.currentUserBooking).toMatchObject({ status: 'BOOKED' });
      });
  });
  it('scopes editing and attendance to the authorized box and class', async () => {
    await edit('coach', { description: 'Wrong box' }, 'foreign').expect(404);
    await edit(
      'coach',
      { description: 'Wrong box' },
      'foreign',
      'other-box',
    ).expect(403);
    await attendance('coach', 'ATTENDED', 'athlete', 'foreign').expect(404);
    await attendance(
      'coach',
      'ATTENDED',
      'athlete',
      'foreign',
      'other-box',
    ).expect(403);
  });
  it('persists attended and undo immediately, retaining booked totals', async () => {
    await attendance('coach', 'ATTENDED')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ATTENDED');
      });
    await detail('owner')
      .expect(200)
      .expect((response) => {
        expect(response.body.bookedCount).toBe(2);
        expect(
          response.body.bookings.filter(
            (row: { status: string }) => row.status === 'ATTENDED',
          ),
        ).toHaveLength(1);
        expect(response.body.bookings).toHaveLength(2);
      });
    await attendance('owner', 'BOOKED').expect(200);
    await detail('coach')
      .expect(200)
      .expect((response) => {
        expect(
          response.body.bookings.every(
            (row: { status: string }) => row.status === 'BOOKED',
          ),
        ).toBe(true);
      });
    await attendance('coach', 'ABSENT').expect(400);
    await attendance('coach', 'ATTENDED', 'outsider').expect(404);
  });
  it('enforces deletion safeguards independently', async () => {
    await remove('coach', 'attended').expect(409);
    await remove('owner', 'empty').expect(200);
    await detail('owner', 'empty').expect(404);
  });
});
