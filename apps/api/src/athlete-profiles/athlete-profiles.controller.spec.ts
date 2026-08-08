import { Test, TestingModule } from '@nestjs/testing';
import { AthleteProfilesController } from './athlete-profiles.controller';

describe('AthleteProfilesController', () => {
  let controller: AthleteProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AthleteProfilesController],
    }).compile();

    controller = module.get<AthleteProfilesController>(AthleteProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
