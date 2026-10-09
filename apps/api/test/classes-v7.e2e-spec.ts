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
describe('Classes v7 (database e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const prefix = `classes-v7-${randomUUID()}`;
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
  const detail = (actor: Actor, classKey = 'class', boxKey = 'box') =>
    request(app.getHttpServer())
      .get(`/boxes/${id(boxKey)}/classes/${id(classKey)}`)
      .set('x-test-actor', actor);
  const booking = (
    actor: Actor,
    method: 'post' | 'delete',
    classKey = 'class',
  ) =>
    request(app.getHttpServer())
      [method](`/boxes/${id('box')}/classes/${id(classKey)}/book`)
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
      data: ['class', 'attended', 'past', 'foreign'].map((key) => ({
        id: id(key),
        boxId: id(key === 'foreign' ? 'other-box' : 'box'),
        name: key,
        startsAt: new Date(Date.now() + (key === 'past' ? -3600000 : 86400000)),
        durationMinutes: 60,
        capacity: 1,
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
  }, 30000);
  afterAll(async () => {
    if (prisma) {
      await prisma.box.deleteMany({
        where: { id: { in: [id('box'), id('other-box')] } },
      });
      await prisma.user.deleteMany({ where: { id: { in: actors.map(id) } } });
    }
    await app?.close();
  });
  it.each(['athlete', 'coach', 'owner', 'admin'] as const)(
    'allows %s to read an authorized detail',
    async (actor) => {
      const response = await detail(actor).expect(200);
      expect(response.body).toMatchObject({
        id: id('class'),
        bookedCount: 0,
        currentUserBooking: null,
      });
    },
  );
  it.each(['pending', 'outsider'] as const)(
    'denies %s class reads and booking mutations',
    async (actor) => {
      await detail(actor).expect(403);
      await booking(actor, 'post').expect(403);
      await booking(actor, 'delete').expect(403);
    },
  );
  it('scopes the class ID to the authorized box', async () => {
    await detail('athlete', 'foreign').expect(404);
    await detail('athlete', 'foreign', 'other-box').expect(403);
    await booking('athlete', 'post', 'foreign').expect(404);
  });
  it('books once, rejects duplicates/full capacity, and cancels without another confirmation', async () => {
    await booking('athlete', 'post').expect(201);
    const own = await detail('athlete').expect(200);
    expect(own.body).toMatchObject({
      bookedCount: 1,
      currentUserBooking: { status: 'BOOKED' },
      bookings: [],
    });
    const other = await detail('second').expect(200);
    expect(other.body).toMatchObject({
      bookedCount: 1,
      currentUserBooking: null,
      bookings: [],
    });
    await booking('athlete', 'post').expect(409);
    await booking('second', 'post').expect(409);
    await booking('second', 'delete').expect(404);
    await booking('athlete', 'delete').expect(200);
    const canceled = await detail('athlete').expect(200);
    expect(canceled.body).toMatchObject({
      bookedCount: 0,
      currentUserBooking: null,
    });
    await booking('second', 'post').expect(201);
  });
  it('preserves attended reservations and prevents bookings after class start', async () => {
    await booking('athlete', 'delete', 'attended').expect(404);
    await detail('athlete', 'attended')
      .expect(200)
      .expect((response) => {
        expect(
          (response.body as { currentUserBooking: { status: string } })
            .currentUserBooking.status,
        ).toBe('ATTENDED');
      });
    await booking('athlete', 'post', 'past').expect(400);
  });
  it('retains staff roster access', async () => {
    const response = await detail('coach').expect(200);
    const body = response.body as { bookings: { userId: string }[] };
    expect(body.bookings).toHaveLength(1);
    expect(body.bookings[0].userId).toBe(id('second'));
  });
});
