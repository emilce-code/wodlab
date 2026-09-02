'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

import WorkoutLifecycleActions from './WorkoutLifecycleActions';

export type Workout = {
  id: string;
  name: string;
  description: string | null;
  isBenchmark: boolean;
  isActive: boolean;
  deactivatedAt: string | null;
  resultCount: number;

  createdByUser: {
    id: string;
    email: string;
  };

  type: {
    key: string;
    name: string;
  };

  variants: {
    id: string;

    level: {
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
  }[];
};

type Props = {
  workout: Workout;
  canManage: boolean;
};

export default function WorkoutCard({
  workout,
  canManage,
}: Props) {
  const t =
    useTranslations(
      'workouts.library',
    );

  const typeT =
    useTranslations(
      'workoutTypes',
    );

  const defaultVariant =
    workout.variants.find(
      (variant) =>
        variant.level.key ===
        'RX',
    ) ??
    workout.variants[0];

  const firstSection =
    defaultVariant?.sections[0];

  const movementNames =
    Array.from(
      new Set(
        defaultVariant?.sections.flatMap(
          (section) =>
            section.movements.map(
              (item) =>
                item.movement.name,
            ),
        ) ?? [],
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
    <Card className="group flex h-full flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {getWorkoutTypeName()}
            </p>

            {defaultVariant && (
              <Badge>
                {
                  defaultVariant
                    .level.name
                }
              </Badge>
            )}
          </div>

          {workout.isBenchmark && (
            <Badge>
              {t('benchmark')}
            </Badge>
          )}
        </div>

        <Link href={`/workouts/${workout.id}`} className="mt-4 block">
          <h2 className="text-2xl font-black tracking-tight transition-colors group-hover:text-accent">
            {workout.name}
          </h2>
        </Link>

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

        {workout.variants.length >
          1 && (
          <p className="mt-5 text-xs text-muted">
            {workout.variants
              .map(
                (variant) =>
                  variant.level.name,
              )
              .join(' · ')}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
          <Link
            href={`/workouts/${workout.id}`}
            className="text-sm font-semibold text-muted transition-colors group-hover:text-accent"
          >
            {t('viewWorkout')} →
          </Link>

          {canManage && <WorkoutLifecycleActions workout={workout} />}
        </div>
      </Card>
  );
}
