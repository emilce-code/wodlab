import { Test } from '@nestjs/testing';

import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('CoachesController', () => {
  it('is defined with the coach service', async () => {
    const module = await Test.createTestingModule({
      controllers: [CoachesController],
      providers: [{ provide: CoachesService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(CoachesController)).toBeDefined();
  });
});
