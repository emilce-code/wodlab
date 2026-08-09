'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export type Workout = {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;

  type: {
    key: string;
    name: string;
  };

  sections: {
    id: string;
    order: number;
    repScheme: number[];

    movements: {
      id: string;

      movement: {
        id: string;
        name: string;
      };
    }[];
  }[];
};

type Props = {
  workout: Workout;
};

export default function WorkoutCard({
  workout,
}: Props) {
  const t =
    useTranslations(
      'workouts.library',
    );

  const typeT =
    useTranslations(
      'workoutTypes',
    );

  const firstSection =
    workout.sections[0];

  const movementNames =
    Array.from(
      new Set(
        workout.sections.flatMap(
          (section) =>
            section.movements.map(
              (item) =>
                item.movement.name,
            ),
        ),
      ),
    );

  function getWorkoutTypeName() {
    const key =
      workout.type.key
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll('-', '_');

    return typeT.has(key)
      ? typeT(key)
      : workout.type.name;
  }

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col p-6 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/40">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {getWorkoutTypeName()}
          </p>

          {workout.isBenchmark && (
            <Badge>
              {t('benchmark')}
            </Badge>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-tight transition-colors group-hover:text-accent">
          {workout.name}
        </h2>

        {firstSection
          ?.repScheme.length >
          0 && (
          <p className="mt-4 text-xl font-bold tracking-wide">
            {firstSection.repScheme.join(
              ' — ',
            )}
          </p>
        )}

        {workout.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted">
            {
              workout.description
            }
          </p>
        )}

        <div className="mt-6 space-y-2">
          {movementNames
            .slice(0, 4)
            .map((name) => (
              <p
                key={name}
                className="text-sm font-medium"
              >
                {name}
              </p>
            ))}

          {movementNames.length >
            4 && (
            <p className="text-xs text-muted">
              {t('moreMovements', {
                count:
                  movementNames.length -
                  4,
              })}
            </p>
          )}
        </div>

        <div className="mt-auto pt-8">
          <span className="text-sm font-semibold text-muted transition-colors group-hover:text-accent">
            {t('viewWorkout')} →
          </span>
        </div>
      </Card>
    </Link>
  );
}