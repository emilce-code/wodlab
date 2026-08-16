import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { Auth0AuthGuard } from './auth0-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    Auth0AuthGuard,
    JwtAuthGuard,
  ],

  exports: [
    Auth0AuthGuard,
    JwtAuthGuard,
  ],
})
export class AuthModule {}