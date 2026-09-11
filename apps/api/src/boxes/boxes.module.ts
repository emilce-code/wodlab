import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BoxesController } from './boxes.controller';
import { BoxesService } from './boxes.service';

@Module({
  imports: [AuthModule],
  controllers: [BoxesController],
  providers: [BoxesService],
})
export class BoxesModule {}
