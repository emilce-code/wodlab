import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

// Exercise real DTO validation, scoped authorization and persistence against local PostgreSQL.
// Authentication is replaced at the boundary; this does not test Auth0 token verification.
describe('Box Details v4 (database e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const prefix = `box-details-test-${randomUUID()}`;
  const actors = [
    'admin',
    'owner',
    'org-owner',
    'coach',
    'athlete',
    'outsider',
  ] as const;
  const id = (key: string) => `${prefix}-${key}`;
  const boxId = id('box');
  const otherBoxId = id('other-box');
  const orgId = id('org');
  const client = (actor: (typeof actors)[number]) =>
    request(app.getHttpServer())
      .patch(`/boxes/${boxId}`)
      .set('x-test-actor', actor);

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<{ headers: Record<string, string>; user?: unknown }>();
          const actor = req.headers['x-test-actor'];
          req.user = {
            userId: id(actor),
            role: actor === 'admin' ? 'ADMIN' : 'USER',
            permissions: [],
          };
          return actors.includes(actor as (typeof actors)[number]);
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
    await prisma.boxOrganization.create({
      data: {
        id: orgId,
        name: 'Test organization',
        owners: { create: { userId: id('org-owner') } },
      },
    });
    await prisma.box.create({
      data: {
        id: boxId,
        name: 'Test Box',
        ownerUserId: id('owner'),
        joinCode: randomUUID(),
        organizationId: orgId,
        supportContact: 'Legacy instructions',
        memberships: {
          create: [
            {
              userId: id('owner'),
              roleId: 'box-membership-role-owner',
              status: 'ACTIVE',
            },
            {
              userId: id('coach'),
              roleId: 'box-membership-role-coach',
              status: 'ACTIVE',
            },
            {
              userId: id('athlete'),
              roleId: 'box-membership-role-athlete',
              status: 'ACTIVE',
            },
          ],
        },
      },
    });
    await prisma.box.create({
      data: {
        id: otherBoxId,
        name: 'Other Box',
        ownerUserId: id('outsider'),
        joinCode: randomUUID(),
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.box.deleteMany({
        where: { id: { in: [boxId, otherBoxId] } },
      });
      await prisma.boxOrganization.deleteMany({ where: { id: orgId } });
      await prisma.user.deleteMany({
        where: { id: { in: actors.map((actor) => id(actor)) } },
      });
    }
    await app?.close();
  });

  it.each(['admin', 'owner', 'org-owner'] as const)(
    'allows %s to edit optional contacts/location/logo',
    async (actor) => {
      await client(actor)
        .send({
          whatsapp: '+595 (981) 123-456',
          phone: null,
          email: 'hello@example.com',
          instagram: '@box',
          website: 'https://example.com',
          description: '',
          address: '',
          latitude: 0,
          longitude: 0,
          logoPath: `boxes/${boxId}/logo.webp`,
        })
        .expect(200);
      const box = await prisma.box.findUniqueOrThrow({ where: { id: boxId } });
      expect(box).toMatchObject({
        whatsapp: '+595981123456',
        description: null,
        address: null,
        latitude: 0,
        longitude: 0,
        supportContact: 'Legacy instructions',
      });
      await client(actor).send({ logoPath: null }).expect(200);
    },
  );

  it.each(['coach', 'athlete', 'outsider'] as const)(
    'denies %s profile and logo mutations',
    async (actor) => {
      await client(actor)
        .send({ name: 'Unauthorized', logoPath: null })
        .expect(403);
    },
  );

  it('denies cross-box editing by box and organization owners', async () => {
    for (const actor of ['owner', 'org-owner'])
      await request(app.getHttpServer())
        .patch(`/boxes/${otherBoxId}`)
        .set('x-test-actor', actor)
        .send({ name: 'Unauthorized' })
        .expect(403);
  });

  it('rejects image references to another box and traversal paths', async () => {
    await client('owner')
      .send({ logoPath: `boxes/${otherBoxId}/logo.webp` })
      .expect(400);
    await client('owner')
      .send({ logoPath: `boxes/${boxId}/../other/logo.webp` })
      .expect(400);
  });

  it('returns member contacts and scoped owner capability', async () => {
    for (const actor of ['owner', 'org-owner', 'admin', 'coach', 'athlete']) {
      const response = await request(app.getHttpServer())
        .get(`/boxes/${boxId}`)
        .set('x-test-actor', actor)
        .expect(200);
      expect(response.body as { canEditDetails: boolean }).toMatchObject({
        canEditDetails: ['owner', 'org-owner', 'admin'].includes(actor),
      });
    }
    await request(app.getHttpServer())
      .get(`/boxes/${boxId}`)
      .set('x-test-actor', 'outsider')
      .expect(403);
  });

  it('discovers organization-owned boxes without requiring membership', async () => {
    const response = await request(app.getHttpServer())
      .get('/boxes/managed')
      .set('x-test-actor', 'org-owner')
      .expect(200);
    expect(
      (response.body as Array<{ id: string }>).map((box) => box.id),
    ).toEqual([boxId]);
  });

  it('rejects unsafe contacts and invalid coordinates before persistence', async () => {
    await client('owner').send({ website: 'javascript:alert(1)' }).expect(400);
    await client('owner').send({ latitude: 91 }).expect(400);
    await client('owner').send({ email: 'bad' }).expect(400);
  });

  it('preserves defaults and allows clearing optional values', async () => {
    await client('owner')
      .send({
        latitude: null,
        longitude: null,
        timezone: '',
        whatsapp: '',
        email: null,
      })
      .expect(200);
    const box = await prisma.box.findUniqueOrThrow({ where: { id: boxId } });
    expect(box).toMatchObject({
      latitude: null,
      longitude: null,
      timezone: 'UTC',
      whatsapp: null,
      email: null,
    });
    await client('owner').send({ latitude: 12 }).expect(400);
  });

  it('reserves organization reassignment for administrators', async () => {
    await client('owner').send({ organizationId: null }).expect(403);
    await client('org-owner').send({ organizationId: null }).expect(403);
    await client('admin').send({ organizationId: null }).expect(200);
    await client('admin').send({ organizationId: orgId }).expect(200);
  });
});
