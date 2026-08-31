import { Test, TestingModule } from '@nestjs/testing';

import { Auth0AuthGuard } from '../auth/auth0-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {};

  const auth0AuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: Auth0AuthGuard,
          useValue: auth0AuthGuardMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: jwtAuthGuardMock,
        },
      ],
    })
      .overrideGuard(Auth0AuthGuard)
      .useValue(auth0AuthGuardMock)
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
