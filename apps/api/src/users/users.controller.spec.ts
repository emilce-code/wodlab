import { Test, TestingModule } from '@nestjs/testing';

import { Auth0AuthGuard } from '../auth/auth0-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AthleteBalanceInsightsService } from './athlete-balance-insights.service';
import { AthleteInsightsService } from './athlete-insights.service';
import { AthletePerformanceInsightsService } from './athlete-performance-insights.service';
import {
  AthleteInsightsPeriod,
  type FindAthleteInsightsQueryDto,
} from './dto/find-athlete-insights-query.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {};
  const athleteInsightsServiceMock = {
    getConsistency: jest.fn(),
  };
  const athleteBalanceInsightsServiceMock = {
    getBalance: jest.fn(),
  };
  const athletePerformanceInsightsServiceMock = {
    getPerformance: jest.fn(),
  };

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
          provide: AthleteInsightsService,
          useValue: athleteInsightsServiceMock,
        },
        {
          provide: AthleteBalanceInsightsService,
          useValue: athleteBalanceInsightsServiceMock,
        },
        {
          provide: AthletePerformanceInsightsService,
          useValue: athletePerformanceInsightsServiceMock,
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

  const query: FindAthleteInsightsQueryDto = {
    period: AthleteInsightsPeriod.NINETY_DAYS,
    timeZone: 'America/Asuncion',
  };

  const request = {
    user: {
      userId: 'user-1',
      email: 'athlete@example.com',
    },
  } as Parameters<UsersController['getConsistencyInsights']>[0];

  it('delegates consistency insights using the authenticated user', async () => {
    await controller.getConsistencyInsights(request, query);

    expect(athleteInsightsServiceMock.getConsistency).toHaveBeenCalledWith(
      'user-1',
      query,
    );
  });

  it('delegates performance insights using the authenticated user', async () => {
    await controller.getPerformanceInsights(request, query);

    expect(
      athletePerformanceInsightsServiceMock.getPerformance,
    ).toHaveBeenCalledWith('user-1', query);
  });

  it('delegates balance insights using the authenticated user', async () => {
    await controller.getBalanceInsights(request, query);

    expect(athleteBalanceInsightsServiceMock.getBalance).toHaveBeenCalledWith(
      'user-1',
      query,
    );
  });
});
