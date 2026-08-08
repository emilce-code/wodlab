import { Test, TestingModule } from '@nestjs/testing';
import { AthleteProfilesService } from './athlete-profiles.service';

describe('AthleteProfilesService', () => {
  let service: AthleteProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AthleteProfilesService],
    }).compile();

    service = module.get<AthleteProfilesService>(AthleteProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
