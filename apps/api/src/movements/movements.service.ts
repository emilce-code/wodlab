import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { MovementResponseDto } from './dto/movement-response.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: FindMovementsQueryDto,
  ): Promise<MovementResponseDto[]> {
    const {
      search,
      category,
      measurementType,
      foundational,
    } = query;

    const normalizedSearch = search?.trim().toLowerCase();

    const movements = await this.prisma.movement.findMany({
      where: {
        ...(normalizedSearch
          ? {
              searchText: {
                contains: normalizedSearch,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(category
          ? {
              category: {
                key: category,
              },
            }
          : {}),

        ...(measurementType
          ? {
              measurementTypes: {
                some: {
                  measurementType: {
                    key: measurementType,
                  },
                },
              },
            }
          : {}),

        ...(foundational === 'true'
          ? {
              isFoundational: true,
            }
          : {}),
      },

      include: {
        category: true,
        measurementTypes: {
          include: {
            measurementType: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      name: movement.name,
      category: {
        key: movement.category.key,
        name: movement.category.name,
      },
      measurementTypes: movement.measurementTypes.map((item) => ({
        key: item.measurementType.key,
        name: item.measurementType.name,
      })),
      isFoundational: movement.isFoundational,
      official: movement.official,
      aliases: movement.aliases,
    }));
  }

  findCategories() {
    return this.prisma.movementCategory.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        key: true,
        name: true,
      },
    });
  }

  findMeasurementTypes() {
    return this.prisma.measurementType.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        key: true,
        name: true,
      },
    });
  }
}