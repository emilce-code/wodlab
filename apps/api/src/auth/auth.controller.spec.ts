import { Test, TestingModule } from '@nestjs/testing';

import { Auth0AuthGuard } from './auth0-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {};

  const auth0AuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authServiceMock,
          },
        ],
      })
        .overrideGuard(Auth0AuthGuard)
        .useValue(auth0AuthGuardMock)
        .compile();

    controller =
      module.get<AuthController>(
        AuthController,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});