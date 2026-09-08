import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoachProgrammingController } from './coach-programming.controller';
import { CoachProgrammingService } from './coach-programming.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CoachProgrammingController],
  providers: [CoachProgrammingService],
})
export class CoachProgrammingModule {}
