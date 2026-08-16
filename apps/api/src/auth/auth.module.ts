import {
  forwardRef,
  Module,
} from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { Auth0AuthGuard } from './auth0-auth.guard';
import { Auth0TestController } from './auth0-test.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,

    forwardRef(
      () => UsersModule,
    ),

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.getOrThrow<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
    Auth0TestController,
  ],

  providers: [
    AuthService,
    Auth0AuthGuard,
    JwtAuthGuard
  ],

  exports: [
    AuthService,
    JwtModule,
    Auth0AuthGuard,
    JwtAuthGuard
  ],
})
export class AuthModule {}