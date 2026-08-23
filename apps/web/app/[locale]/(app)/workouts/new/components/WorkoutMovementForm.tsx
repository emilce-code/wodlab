'use client';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import type { PrescriptionCategory, } from '../page';

export type MovementOption = {
  id: string;
  name: string;
  aliases: string[];

  category: {
    key: string;
    name: string;
  };

  measurementTypes: {
    key: string;
    name: string;
  }[];
};

export type WorkoutMovementPrescriptionFormState = {
  categoryKey: string;
  reps: string;
  weight: string;
  weightUnit: 'KG' | 'LB' | '';
  distance: string;
  calories: string;
  durationSeconds: string;
  notes: string;
};

export type WorkoutMovementFormState = {
  id: string;
  movementId: string;
  movementName: string;

  reps: string;
  weight: string;
  weightUnit: 'KG' | 'LB' | '';
  distance: string;
  calories: string;
  durationSeconds: string;
  notes: string;

  prescriptions: WorkoutMovementPrescriptionFormState[];
};

type Props = {
  movement: WorkoutMovementFormState;
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  onChange: (
    movement: WorkoutMovementFormState,
  ) => void;
  onRemove: () => void;
};

export default function WorkoutMovementForm({
  movement,
  prescriptionCategories,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const t = useTranslations(
    'workouts.create.movementBuilder',
  );

  const [search, setSearch] =
    useState(
      movement.movementName,
    );

  const [results, setResults] =
    useState<MovementOption[]>(
      [],
    );

  const [
    selectedMovement,
    setSelectedMovement,
  ] =
    useState<MovementOption | null>(
      null,
    );

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const normalizedSearch =
      search.trim();

    if (
      movement.movementId &&
      normalizedSearch ===
        movement.movementName
    ) {
      return;
    }

    if (
      normalizedSearch.length < 2
    ) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const controller =
      new AbortController();

    const timeout = setTimeout(
      async () => {
        setIsSearching(true);
        setSearchError(null);

        try {
          const response =
            await fetch(
              `/api/movements?search=${encodeURIComponent(
                normalizedSearch,
              )}`,
              {
                signal:
                  controller.signal,
              },
            );

          if (!response.ok) {
            throw new Error(
              'Unable to search movements',
            );
          }

          const data =
            (await response.json()) as MovementOption[];

          setResults(data);
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              'AbortError'
          ) {
            return;
          }

          setResults([]);

          setSearchError(
            t('searchError'),
          );
        } finally {
          setIsSearching(false);
        }
      },
      300,
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    search,
    movement.movementId,
    movement.movementName,
    t,
  ]);

  function update(
    field: keyof WorkoutMovementFormState,
    value: string,
  ) {
    onChange({
      ...movement,
      [field]: value,
    });
  }

  function clearPrescriptionFields() {
    return {
      reps: '',
      weight: '',
      weightUnit: '' as const,
      distance: '',
      calories: '',
      durationSeconds: '',
      prescriptions: [],
    };
  }

  function selectMovement(
    option: MovementOption,
  ) {
    setSelectedMovement(option);
    setSearch(option.name);
    setResults([]);
    setSearchError(null);

    onChange({
      ...movement,
      movementId: option.id,
      movementName: option.name,
      ...clearPrescriptionFields(),
    });
  }

  function clearSelectedMovement() {
    setSelectedMovement(null);
    setSearch('');
    setResults([]);
    setSearchError(null);

    onChange({
      ...movement,
      movementId: '',
      movementName: '',
      ...clearPrescriptionFields(),
    });
  }

  function hasPrescription(
    categoryKey: string,
  ) {
    return movement.prescriptions.some(
      (prescription) =>
        prescription.categoryKey ===
        categoryKey,
    );
  }

  function togglePrescription(
    categoryKey: string,
  ) {
    if (hasPrescription(categoryKey)) {
      onChange({
        ...movement,
        prescriptions:
          movement.prescriptions.filter(
            (prescription) =>
              prescription.categoryKey !==
              categoryKey,
          ),
      });
      return;
    }

    onChange({
      ...movement,
      prescriptions: [
        ...movement.prescriptions,
        {
          categoryKey,
          reps: '',
          weight: '',
          weightUnit: '',
          distance: '',
          calories: '',
          durationSeconds: '',
          notes: '',
        },
      ],
    });
  }

  function updatePrescription(
    categoryKey: string,
    field:
      | 'reps'
      | 'weight'
      | 'weightUnit'
      | 'distance'
      | 'calories'
      | 'durationSeconds'
      | 'notes',
    value: string,
  ) {
    onChange({
      ...movement,
      prescriptions:
        movement.prescriptions.map(
          (prescription) =>
            prescription.categoryKey ===
            categoryKey
              ? {
                  ...prescription,
                  [field]: value,
                }
              : prescription,
        ),
    });
  }

  const supportsReps =
    selectedMovement?.measurementTypes.some(
      (type) =>
        type.key === 'REPS',
    ) ?? false;

  const supportsWeight =
    selectedMovement?.measurementTypes.some(
      (type) =>
        type.key === 'WEIGHT',
    ) ?? false;

  const supportsDistance =
    selectedMovement?.measurementTypes.some(
      (type) =>
        type.key ===
        'DISTANCE',
    ) ?? false;

  const supportsCalories =
    selectedMovement?.measurementTypes.some(
      (type) =>
        type.key ===
        'CALORIES',
    ) ?? false;

  const supportsDuration =
    selectedMovement?.measurementTypes.some(
      (type) =>
        type.key ===
        'DURATION',
    ) ?? false;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            {t('movement')}
          </label>

          {movement.movementId ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {
                    movement.movementName
                  }
                </p>

                {selectedMovement && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {
                        selectedMovement
                          .category.name
                      }
                    </span>

                    {selectedMovement
                      .aliases.length >
                      0 && (
                      <span className="text-xs text-muted">
                        ·{' '}
                        {selectedMovement.aliases.join(
                          ', ',
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={
                  clearSelectedMovement
                }
                className="shrink-0 text-sm font-medium text-muted transition hover:text-foreground"
              >
                {t('change')}
              </button>
            </div>
          ) : (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target
                      .value,
                  );

                  if (
                    event.target
                      .value !==
                    movement.movementName
                  ) {
                    setSelectedMovement(
                      null,
                    );

                    onChange({
                      ...movement,
                      movementId: '',
                      movementName:
                        '',
                      ...clearPrescriptionFields(),
                    });
                  }
                }}
                placeholder={t(
                  'searchPlaceholder',
                )}
                aria-label={t(
                  'searchLabel',
                )}
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />

              {(isSearching ||
                searchError ||
                results.length >
                  0) && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                  {isSearching && (
                    <div className="px-4 py-3 text-sm text-muted">
                      {t(
                        'searching',
                      )}
                    </div>
                  )}

                  {!isSearching &&
                    searchError && (
                      <div className="px-4 py-3 text-sm text-red-500">
                        {
                          searchError
                        }
                      </div>
                    )}

                  {!isSearching &&
                    !searchError &&
                    results.length ===
                      0 &&
                    search
                      .trim()
                      .length >=
                      2 && (
                      <div className="px-4 py-3 text-sm text-muted">
                        {t(
                          'noResults',
                        )}
                      </div>
                    )}

                  {!isSearching &&
                    results.map(
                      (option) => (
                        <button
                          key={
                            option.id
                          }
                          type="button"
                          onClick={() =>
                            selectMovement(
                              option,
                            )
                          }
                          className="block w-full border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-surface-elevated"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">
                                {
                                  option.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted">
                                {
                                  option
                                    .category
                                    .name
                                }
                              </p>
                            </div>

                            {option
                              .aliases
                              .length >
                              0 && (
                              <span className="shrink-0 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                                {option.aliases.join(
                                  ' · ',
                                )}
                              </span>
                            )}
                          </div>
                        </button>
                      ),
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-7 shrink-0 text-sm font-medium text-muted transition hover:text-red-500"
          >
            {t('remove')}
          </button>
        )}
      </div>

      {selectedMovement && (
        <>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t('prescription')}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {supportsReps && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('reps')}
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      movement.reps
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        'reps',
                        event.target
                          .value,
                      )
                    }
                    placeholder="10"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  />
                </div>
              )}

              {supportsWeight && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t(
                        'weight',
                      )}
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        movement.weight
                      }
                      onChange={(
                        event,
                      ) =>
                        update(
                          'weight',
                          event.target
                            .value,
                        )
                      }
                      placeholder="43"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t('unit')}
                    </label>

                    <select
                      value={
                        movement.weightUnit
                      }
                      onChange={(
                        event,
                      ) =>
                        update(
                          'weightUnit',
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    >
                      <option value="">
                        {t(
                          'selectUnit',
                        )}
                      </option>

                      <option value="KG">
                        KG
                      </option>

                      <option value="LB">
                        LB
                      </option>
                    </select>
                  </div>
                </>
              )}

              {supportsDistance && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t(
                      'distance',
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={
                        movement.distance
                      }
                      onChange={(
                        event,
                      ) =>
                        update(
                          'distance',
                          event.target
                            .value,
                        )
                      }
                      placeholder="500"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      m
                    </span>
                  </div>
                </div>
              )}

              {supportsCalories && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t(
                      'calories',
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={
                        movement.calories
                      }
                      onChange={(
                        event,
                      ) =>
                        update(
                          'calories',
                          event.target
                            .value,
                        )
                      }
                      placeholder="15"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-12 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      cal
                    </span>
                  </div>
                </div>
              )}

              {supportsDuration && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t(
                      'duration',
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={
                        movement.durationSeconds
                      }
                      onChange={(
                        event,
                      ) =>
                        update(
                          'durationSeconds',
                          event.target
                            .value,
                        )
                      }
                      placeholder="30"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-16 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                      {t(
                        'secondsShort',
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {prescriptionCategories.length > 0 && (
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {t('categoryPrescriptions')}
              </p>

              <p className="mt-1 text-xs text-muted">
                {t('categoryPrescriptionsDescription')}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {prescriptionCategories.map(
                  (category) => {
                    const enabled =
                      hasPrescription(
                        category.key,
                      );

                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() =>
                          togglePrescription(
                            category.key,
                          )
                        }
                        className={
                          enabled
                            ? 'rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent'
                            : 'rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-foreground'
                        }
                      >
                        {enabled ? '✓ ' : '+ '}
                        {category.name}
                      </button>
                    );
                  },
                )}
              </div>

              {movement.prescriptions.length > 0 && (
                <div className="mt-5 space-y-4">
                  {movement.prescriptions.map(
                    (prescription) => {
                      const category =
                        prescriptionCategories.find(
                          (item) =>
                            item.key ===
                            prescription.categoryKey,
                        );

                      if (!category) {
                        return null;
                      }

                      return (
                        <div
                          key={
                            prescription.categoryKey
                          }
                          className="rounded-xl border border-border bg-surface p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h5 className="font-semibold">
                                {category.name}
                              </h5>

                              {category.description && (
                                <p className="mt-1 text-xs text-muted">
                                  {
                                    category.description
                                  }
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                togglePrescription(
                                  category.key,
                                )
                              }
                              className="text-xs font-medium text-muted transition hover:text-red-500"
                            >
                              {t(
                                'removeCategoryPrescription',
                              )}
                            </button>
                          </div>

                          <p className="mt-3 text-xs text-muted">
                            {t(
                              'categoryFallbackHint',
                            )}
                          </p>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {supportsReps && (
                              <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                  {t('reps')}
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    prescription.reps
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updatePrescription(
                                      category.key,
                                      'reps',
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder={
                                    movement.reps ||
                                    '10'
                                  }
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                />
                              </div>
                            )}

                            {supportsWeight && (
                              <>
                                <div>
                                  <label className="mb-1.5 block text-sm font-medium">
                                    {t('weight')}
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={
                                      prescription.weight
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updatePrescription(
                                        category.key,
                                        'weight',
                                        event.target
                                          .value,
                                      )
                                    }
                                    placeholder={
                                      movement.weight ||
                                      '43'
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium">
                                    {t('unit')}
                                  </label>

                                  <select
                                    value={
                                      prescription.weightUnit
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updatePrescription(
                                        category.key,
                                        'weightUnit',
                                        event.target
                                          .value,
                                      )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                  >
                                    <option value="">
                                      {movement.weightUnit ||
                                        t(
                                          'selectUnit',
                                        )}
                                    </option>

                                    <option value="KG">
                                      KG
                                    </option>

                                    <option value="LB">
                                      LB
                                    </option>
                                  </select>
                                </div>
                              </>
                            )}

                            {supportsDistance && (
                              <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                  {t('distance')}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    prescription.distance
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updatePrescription(
                                      category.key,
                                      'distance',
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder={
                                    movement.distance ||
                                    '500'
                                  }
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                />
                              </div>
                            )}

                            {supportsCalories && (
                              <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                  {t('calories')}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    prescription.calories
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updatePrescription(
                                      category.key,
                                      'calories',
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder={
                                    movement.calories ||
                                    '15'
                                  }
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                />
                              </div>
                            )}

                            {supportsDuration && (
                              <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                  {t('duration')}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    prescription.durationSeconds
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updatePrescription(
                                      category.key,
                                      'durationSeconds',
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder={
                                    movement.durationSeconds ||
                                    '30'
                                  }
                                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                                />
                              </div>
                            )}

                            <div className="md:col-span-2">
                              <label className="mb-1.5 block text-sm font-medium">
                                {t('notes')}
                              </label>

                              <input
                                type="text"
                                value={
                                  prescription.notes
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updatePrescription(
                                    category.key,
                                    'notes',
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder={t(
                                  'categoryNotesPlaceholder',
                                )}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium">
              {t('notes')}

              <span className="ml-1 font-normal text-muted">
                {t('optional')}
              </span>
            </label>

            <input
              type="text"
              value={movement.notes}
              onChange={(event) =>
                update(
                  'notes',
                  event.target.value,
                )
              }
              placeholder={t(
                'notesPlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </>
      )}
    </div>
  );
}