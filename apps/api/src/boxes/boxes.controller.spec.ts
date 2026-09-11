import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BoxesController } from './boxes.controller';
import { BoxesService } from './boxes.service';

describe('BoxesController', () => {
  it('delegates box listing for the authenticated user', async () => {
    const boxes = { findAll: jest.fn().mockResolvedValue([]) };
    const module = await Test.createTestingModule({
      controllers: [BoxesController],
      providers: [{ provide: BoxesService, useValue: boxes }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    await module
      .get(BoxesController)
      .findAll({ user: { userId: 'user-1' } } as never);
    expect(boxes.findAll).toHaveBeenCalledWith('user-1');
  });

  it('delegates booking for the authenticated member', async () => {
    const boxes = { book: jest.fn().mockResolvedValue({}) };
    const module = await Test.createTestingModule({
      controllers: [BoxesController],
      providers: [{ provide: BoxesService, useValue: boxes }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    await module
      .get(BoxesController)
      .book({ user: { userId: 'user-1' } } as never, 'box-1', 'class-1');
    expect(boxes.book).toHaveBeenCalledWith('user-1', 'box-1', 'class-1');
  });
});
