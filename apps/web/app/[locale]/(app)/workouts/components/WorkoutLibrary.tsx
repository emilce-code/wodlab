'use client';

import {
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import WorkoutCard, {
  Workout,
} from './WorkoutCard';

type Filter =
  | 'ALL'
  | 'BENCHMARK';

type Props = {
  workouts: Workout[];
};

export default function WorkoutLibrary({
  workouts,
}: Props) {
  const t =
    useTranslations(
      'workouts.library',
    );

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState<Filter>('ALL');

  const filteredWorkouts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return workouts.filter(
        (workout) => {
          if (
            filter ===
              'BENCHMARK' &&
            !workout.isBenchmark
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const movementNames =
            workout.variants.flatMap(
              (variant) =>
                variant.sections.flatMap(
                  (section) =>
                    section.movements.map(
                      (item) =>
                        item.movement
                          .name,
                    ),
                ),
            );

          const searchable = [
            workout.name,
            workout.description ??
              '',
            workout.type.name,
            ...movementNames,
          ]
            .join(' ')
            .toLowerCase();

          return searchable.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      workouts,
      search,
      filter,
    ]);

  return (
    <>
      <div className="mt-8">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder={t(
              'searchPlaceholder',
            )}
            aria-label={t(
              'searchLabel',
            )}
            className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <FilterButton
          active={
            filter === 'ALL'
          }
          onClick={() =>
            setFilter('ALL')
          }
        >
          {t('all')}
        </FilterButton>

        <FilterButton
          active={
            filter ===
            'BENCHMARK'
          }
          onClick={() =>
            setFilter(
              'BENCHMARK',
            )
          }
        >
          {t('benchmark')}
        </FilterButton>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted">
          {t('workoutCount', {
            count:
              filteredWorkouts.length,
          })}
        </p>
      </div>

      {filteredWorkouts.length ===
      0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-semibold">
            {t('emptyTitle')}
          </p>

          <p className="mt-2 text-sm text-muted">
            {t(
              'emptyDescription',
            )}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkouts.map(
            (workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
              />
            ),
          )}
        </div>
      )}
    </>
  );
}

type FilterButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function FilterButton({
  children,
  active,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-4 py-2 text-sm font-semibold transition',

        active
          ? 'bg-accent text-accent-foreground'
          : 'border border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  );
}