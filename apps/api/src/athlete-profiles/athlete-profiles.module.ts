import { Module } from '@nestjs/common';
import { AthleteProfilesService } from './athlete-profiles.service';
import { AthleteProfilesController } from './athlete-profiles.controller';

@Module({
  providers: [AthleteProfilesService],
  controllers: [AthleteProfilesController]
})
export class AthleteProfilesModule {}
