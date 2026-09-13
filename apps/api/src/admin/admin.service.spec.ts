import { BadRequestException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

const prisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  userRoleChange: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('AdminService', () => {
  const service = new AdminService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof prisma) => unknown) => callback(prisma),
    );
  });

  it('lists users with pagination', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
    prisma.user.count.mockResolvedValue(1);

    await expect(service.findUsers({ page: 1, pageSize: 12 })).resolves.toEqual(
      {
        items: [{ id: 'user-1' }],
        pagination: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
      },
    );
  });

  it('prevents an administrator from changing their own role', async () => {
    await expect(
      service.updateUserRole('admin-1', 'admin-1', 'USER'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents removal of the last administrator', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'admin-2', role: 'ADMIN' });
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.updateUserRole('admin-1', 'admin-2', 'USER'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates a role and records the audit event', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
    prisma.user.update.mockResolvedValue({ id: 'user-1', role: 'COACH' });
    prisma.userRoleChange.create.mockResolvedValue({ id: 'change-1' });

    await expect(
      service.updateUserRole('admin-1', 'user-1', 'COACH'),
    ).resolves.toEqual({
      id: 'user-1',
      role: 'COACH',
    });
    expect(prisma.userRoleChange.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        previousRole: 'USER',
        newRole: 'COACH',
        changedById: 'admin-1',
      },
    });
  });
});
