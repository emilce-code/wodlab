import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AthleteProfilesController } from './athlete-profiles.controller';
import { AthleteProfilesService } from './athlete-profiles.service';

describe('AthleteProfilesController', () => {
  let controller: AthleteProfilesController;

  const athleteProfilesServiceMock = {};

  const jwtAuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [
          AthleteProfilesController,
        ],
        providers: [
          {
            provide: AthleteProfilesService,
            useValue:
              athleteProfilesServiceMock,
          },
          {
            provide: JwtAuthGuard,
            useValue: jwtAuthGuardMock,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(jwtAuthGuardMock)
        .compile();

    controller =
      module.get<AthleteProfilesController>(
        AthleteProfilesController,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});