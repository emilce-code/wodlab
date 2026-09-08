import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachProgrammingController } from './coach-programming.controller';
import { CoachProgrammingService } from './coach-programming.service';

describe('CoachProgrammingController', () => {
  it('is defined with the programming service', async () => {
    const module = await Test.createTestingModule({
      controllers: [CoachProgrammingController],
      providers: [{ provide: CoachProgrammingService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(CoachProgrammingController)).toBeDefined();
  });
});
