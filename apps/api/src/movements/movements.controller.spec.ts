import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

describe('MovementsController', () => {
  let controller: MovementsController;

  const movementsServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const request = {
    user: {
      userId: 'user-1',
      email: 'user@example.com',
      role: 'USER' as const,
    },
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovementsController],
      providers: [
        {
          provide: MovementsService,
          useValue: movementsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuardMock)
      .compile();

    controller = module.get<MovementsController>(MovementsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the requested language when listing movements', async () => {
    await controller.findAll({}, request as never, 'es-PY');

    expect(movementsServiceMock.findAll).toHaveBeenCalledWith(
      {},
      request.user,
      'es-PY',
    );
  });

  it('forwards the requested language when retrieving a movement', async () => {
    await controller.findOne('movement-1', request as never, 'pt-BR');

    expect(movementsServiceMock.findOne).toHaveBeenCalledWith(
      'movement-1',
      request.user,
      'pt-BR',
    );
  });

  it('forwards the selected language when creating a movement', async () => {
    const dto = {
      name: 'Custom movement',
      categoryKey: 'OTHER',
      measurementTypeKeys: ['REPS'],
      description: 'Descrição personalizada',
    };

    await controller.create(request as never, dto, 'pt-BR');

    expect(movementsServiceMock.create).toHaveBeenCalledWith(
      request.user,
      dto,
      'pt-BR',
    );
  });
});
