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

    const prescriptions =
      await this.prisma.workoutMovementPrescription.findMany({
        where: {
          workoutMovement: { section: { variant: { workoutId } } },
          percentage: { not: null },
          referenceRepMax: { not: null },
          referenceMovementId: { not: null },
        },
        select: {
          id: true,
          percentage: true,
          referenceRepMax: true,
          referenceMovement: { select: { id: true, name: true } },
        },
      });

    const pairs = new Map<string, { movementId: string; reps: number }>();
    for (const prescription of prescriptions) {
      if (prescription.referenceMovement && prescription.referenceRepMax) {
        const key = `${prescription.referenceMovement.id}:${prescription.referenceRepMax}`;
        pairs.set(key, {
          movementId: prescription.referenceMovement.id,
          reps: prescription.referenceRepMax,
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
      targets: prescriptions.map((prescription) => {
        const candidates = results.filter(
          (result) =>
            result.movementId === prescription.referenceMovement?.id &&
            result.reps === prescription.referenceRepMax,
        );
        const best = candidates.reduce<(typeof candidates)[number] | null>(
          (current, result) =>
            !current || this.kilograms(result) > this.kilograms(current)
              ? result
              : current,
          null,
        );
        if (
          !best ||
          !prescription.referenceMovement ||
          prescription.percentage === null
        ) {
          return {
            prescriptionId: prescription.id,
            percentage: Number(prescription.percentage),
            referenceRepMax: prescription.referenceRepMax,
            movement: prescription.referenceMovement,
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
          prescriptionId: prescription.id,
          percentage: Number(prescription.percentage),
          referenceRepMax: prescription.referenceRepMax,
          movement: prescription.referenceMovement,
          repMax: {
            load: this.round(repMax),
            weightUnit: athlete.preferredWeightUnit,
            performedAt: best.performedAt,
          },
          target: {
            load: this.round(repMax * (Number(prescription.percentage) / 100)),
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
