import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingCalculatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkoutTargets(userId: string, workoutId: string) {
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { userId },
      select: { id: true, preferredWeightUnit: true },
    });
    if (!athlete) throw new NotFoundException('Athlete profile not found');

    const [prescriptions, sharedMovements] = await Promise.all([
      this.prisma.workoutMovementPrescription.findMany({
        where: {
          workoutMovement: { section: { variant: { workoutId } } },
          percentage: { not: null },
          referenceRepMax: { not: null },
          referenceMovementId: { not: null },
        },
        select: {
          id: true,
          workoutMovementId: true,
          percentage: true,
          referenceRepMax: true,
          prescriptionCategory: { select: { key: true } },
          referenceMovement: { select: { id: true, name: true } },
        },
      }),
      this.prisma.workoutMovement.findMany({
        where: {
          section: { variant: { workoutId } },
          percentage: { not: null },
          referenceRepMax: { not: null },
        },
        select: {
          id: true,
          movementId: true,
          percentage: true,
          referenceRepMax: true,
          movement: { select: { id: true, name: true } },
        },
      }),
    ]);

    const sources = [
      ...sharedMovements.map((movement) => ({
        prescriptionId: null,
        workoutMovementId: movement.id,
        prescriptionCategoryKey: '',
        percentage: movement.percentage,
        referenceRepMax: movement.referenceRepMax,
        referenceMovement: movement.movement,
      })),
      ...prescriptions.map((prescription) => ({
        prescriptionId: prescription.id,
        workoutMovementId: prescription.workoutMovementId,
        prescriptionCategoryKey: prescription.prescriptionCategory.key,
        percentage: prescription.percentage,
        referenceRepMax: prescription.referenceRepMax,
        referenceMovement: prescription.referenceMovement,
      })),
    ];

    const pairs = new Map<string, { movementId: string; reps: number }>();
    for (const source of sources) {
      if (source.referenceMovement && source.referenceRepMax) {
        const key = `${source.referenceMovement.id}:${source.referenceRepMax}`;
        pairs.set(key, {
          movementId: source.referenceMovement.id,
          reps: source.referenceRepMax,
        });
      }
    }
    const results =
      pairs.size === 0
        ? []
        : await this.prisma.movementResult.findMany({
            where: {
              athleteProfileId: athlete.id,
              measurementType: { key: 'WEIGHT' },
              load: { not: null },
              OR: [...pairs.values()].map((pair) => ({
                movementId: pair.movementId,
                reps: pair.reps,
              })),
            },
            select: {
              movementId: true,
              reps: true,
              load: true,
              weightUnit: true,
              performedAt: true,
            },
          });

    return {
      preferredWeightUnit: athlete.preferredWeightUnit,
      targets: sources.map((source) => {
        const candidates = results.filter(
          (result) =>
            result.movementId === source.referenceMovement?.id &&
            result.reps === source.referenceRepMax,
        );
        const best = candidates.reduce<(typeof candidates)[number] | null>(
          (current, result) =>
            !current || this.kilograms(result) > this.kilograms(current)
              ? result
              : current,
          null,
        );
        if (!best || !source.referenceMovement || source.percentage === null) {
          return {
            prescriptionId: source.prescriptionId,
            workoutMovementId: source.workoutMovementId,
            prescriptionCategoryKey: source.prescriptionCategoryKey,
            percentage: Number(source.percentage),
            referenceRepMax: source.referenceRepMax,
            movement: source.referenceMovement,
            repMax: null,
            target: null,
          };
        }
        const repMax = this.convert(
          Number(best.load),
          best.weightUnit ?? 'KG',
          athlete.preferredWeightUnit,
        );
        return {
          prescriptionId: source.prescriptionId,
          workoutMovementId: source.workoutMovementId,
          prescriptionCategoryKey: source.prescriptionCategoryKey,
          percentage: Number(source.percentage),
          referenceRepMax: source.referenceRepMax,
          movement: source.referenceMovement,
          repMax: {
            load: this.round(repMax),
            weightUnit: athlete.preferredWeightUnit,
            performedAt: best.performedAt,
          },
          target: {
            load: this.round(repMax * (Number(source.percentage) / 100)),
            weightUnit: athlete.preferredWeightUnit,
          },
        };
      }),
    };
  }

  private kilograms(result: { load: unknown; weightUnit: 'KG' | 'LB' | null }) {
    return this.convert(Number(result.load), result.weightUnit ?? 'KG', 'KG');
  }

  private convert(value: number, from: 'KG' | 'LB', to: 'KG' | 'LB') {
    if (from === to) return value;
    return from === 'LB' ? value * 0.45359237 : value / 0.45359237;
  }

  private round(value: number) {
    return Math.round(value * 2) / 2;
  }
}
