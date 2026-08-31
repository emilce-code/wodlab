import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { AthleteProfilesController } from './athlete-profiles.controller';
import { AthleteProfilesService } from './athlete-profiles.service';

@Module({
  imports: [AuthModule, PrismaModule],

  controllers: [AthleteProfilesController],

  providers: [AthleteProfilesService],

  exports: [AthleteProfilesService],
})
export class AthleteProfilesModule {}
