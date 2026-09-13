import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  it('delegates a role change using the authenticated administrator', async () => {
    const admin = { updateUserRole: jest.fn() };
    const controller = new AdminController(admin as unknown as AdminService);
    const request = {
      user: { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    } as never;

    await controller.updateUserRole(request, 'user-1', { role: 'COACH' });

    expect(admin.updateUserRole).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'COACH',
    );
  });
});
