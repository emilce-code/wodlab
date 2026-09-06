import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CoachesController],
  providers: [CoachesService],
})
export class CoachesModule {}
