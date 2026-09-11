import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutImportsController } from './workout-imports.controller';
import { WorkoutImportsService } from './workout-imports.service';

describe('WorkoutImportsController', () => {
  it('delegates text parsing without persisting a workout', async () => {
    const imports = { parse: jest.fn().mockResolvedValue({ draft: {} }) };
    const module = await Test.createTestingModule({
      controllers: [WorkoutImportsController],
      providers: [{ provide: WorkoutImportsService, useValue: imports }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    await module.get(WorkoutImportsController).parse({ text: 'Fran' });
    expect(imports.parse).toHaveBeenCalledWith('Fran');
  });
});
