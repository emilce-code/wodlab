'use client';

import {
  useEffect,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';

import type {
  WorkoutLevel,
  WorkoutType,
} from '../page';

import type {
  WorkoutSectionFormState,
} from './WorkoutSectionForm';

import WorkoutVariantForm, {
  WorkoutVariantFormState,
} from './WorkoutVariantForm';

type Props = {
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
};

function createEmptySection(): WorkoutSectionFormState {
  return {
    id: crypto.randomUUID(),
    typeKey: '',
    rounds: '',
    durationSeconds: '',
    restSeconds: '',
    repScheme: '',
    notes: '',
    movements: [],
  };
}

function createEmptyVariant(
  levelKey = '',
): WorkoutVariantFormState {
  return {
    id: crypto.randomUUID(),
    levelKey,
    name: '',
    notes: '',
    sections: [
      createEmptySection(),
    ],
  };
}

function optionalNumber(
  value: string,
): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  return Number(value);
}

function parseRepScheme(
  value: string,
): number[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split('-')
    .map((part) =>
      Number(part.trim()),
    )
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value > 0,
    );
}

export default function WorkoutForm({
  workoutTypes,
  workoutLevels,
}: Props) {
  const t =
    useTranslations(
      'workouts.create',
    );

  const typeT =
    useTranslations(
      'workoutTypes',
    );

  const router =
    useRouter();

  const [name, setName] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    typeKey,
    setTypeKey,
  ] = useState('');

  const [
    isBenchmark,
    setIsBenchmark,
  ] = useState(false);

  const [
    variants,
    setVariants,
  ] = useState<
    WorkoutVariantFormState[]
  >([]);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const defaultLevel =
      workoutLevels.find(
        (level) =>
          level.key === 'RX',
      ) ??
      workoutLevels[0];

    setVariants([
      createEmptyVariant(
        defaultLevel?.key ?? '',
      ),
    ]);
  }, [workoutLevels]);

  function getWorkoutTypeName(
    type: WorkoutType,
  ) {
    const key =
      type.key.toLowerCase();

    return typeT.has(key)
      ? typeT(key)
      : type.name;
  }

  function addVariant() {
    const usedLevelKeys =
      variants
        .map(
          (variant) =>
            variant.levelKey,
        )
        .filter(Boolean);

    const nextLevel =
      workoutLevels.find(
        (level) =>
          !usedLevelKeys.includes(
            level.key,
          ),
      );

    setVariants((current) => [
      ...current,
      createEmptyVariant(
        nextLevel?.key ?? '',
      ),
    ]);
  }

  function removeVariant(
    id: string,
  ) {
    setVariants((current) => {
      if (
        current.length === 1
      ) {
        return current;
      }

      return current.filter(
        (variant) =>
          variant.id !== id,
      );
    });
  }

  function updateVariant(
    id: string,
    updatedVariant: WorkoutVariantFormState,
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === id
          ? updatedVariant
          : variant,
      ),
    );
  }

  function validateForm():
    | string
    | null {
    if (!name.trim()) {
      return t(
        'validation.nameRequired',
      );
    }

    if (!typeKey) {
      return t(
        'validation.typeRequired',
      );
    }

    if (
      variants.length === 0
    ) {
      return t(
        'variants.validation.variantRequired',
      );
    }

    const usedLevels =
      new Set<string>();

    for (
      let variantIndex = 0;
      variantIndex <
      variants.length;
      variantIndex++
    ) {
      const variant =
        variants[
          variantIndex
        ];

      if (!variant.levelKey) {
        return t(
          'variants.validation.levelRequired',
          {
            variant:
              variantIndex + 1,
          },
        );
      }

      if (
        usedLevels.has(
          variant.levelKey,
        )
      ) {
        return t(
          'variants.validation.duplicateLevel',
        );
      }

      usedLevels.add(
        variant.levelKey,
      );

      if (
        variant.sections
          .length === 0
      ) {
        return t(
          'validation.sectionRequired',
        );
      }

      for (
        let sectionIndex = 0;
        sectionIndex <
        variant.sections.length;
        sectionIndex++
      ) {
        const section =
          variant.sections[
            sectionIndex
          ];

        if (!section.typeKey) {
          return t(
            'validation.sectionTypeRequired',
            {
              section:
                sectionIndex + 1,
            },
          );
        }

        if (
          section.movements
            .length === 0
        ) {
          return t(
            'validation.movementRequired',
            {
              section:
                sectionIndex + 1,
            },
          );
        }

        for (
          let movementIndex = 0;
          movementIndex <
          section.movements.length;
          movementIndex++
        ) {
          const movement =
            section.movements[
              movementIndex
            ];

          if (
            !movement.movementId
          ) {
            return t(
              'validation.movementSelectionRequired',
              {
                section:
                  sectionIndex +
                  1,
                movement:
                  movementIndex +
                  1,
              },
            );
          }
        }

        if (
          section.repScheme.trim()
        ) {
          const parts =
            section.repScheme
              .split('-')
              .map((part) =>
                part.trim(),
              );

          const valid =
            parts.every(
              (part) => {
                if (!part) {
                  return false;
                }

                const value =
                  Number(part);

                return (
                  Number.isInteger(
                    value,
                  ) &&
                  value > 0
                );
              },
            );

          if (!valid) {
            return t(
              'validation.invalidRepScheme',
              {
                section:
                  sectionIndex +
                  1,
              },
            );
          }
        }
      }
    }

    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),

        description:
          description.trim() ||
          undefined,

        typeKey,
        isBenchmark,

        variants:
          variants.map(
            (variant) => ({
              levelKey:
                variant.levelKey,

              name:
                variant.name.trim() ||
                undefined,

              notes:
                variant.notes.trim() ||
                undefined,

              sections:
                variant.sections.map(
                  (
                    section,
                    sectionIndex,
                  ) => ({
                    typeKey:
                      section.typeKey,

                    order:
                      sectionIndex +
                      1,

                    rounds:
                      optionalNumber(
                        section.rounds,
                      ),

                    durationSeconds:
                      optionalNumber(
                        section.durationSeconds,
                      ),

                    restSeconds:
                      optionalNumber(
                        section.restSeconds,
                      ),

                    repScheme:
                      parseRepScheme(
                        section.repScheme,
                      ),

                    notes:
                      section.notes.trim() ||
                      undefined,

                    movements:
                      section.movements.map(
                        (
                          movement,
                          movementIndex,
                        ) => ({
                          movementId:
                            movement.movementId,

                          order:
                            movementIndex +
                            1,

                          reps:
                            optionalNumber(
                              movement.reps,
                            ),

                          weight:
                            optionalNumber(
                              movement.weight,
                            ),

                          weightUnit:
                            movement.weightUnit ||
                            undefined,

                          distance:
                            optionalNumber(
                              movement.distance,
                            ),

                          calories:
                            optionalNumber(
                              movement.calories,
                            ),

                          durationSeconds:
                            optionalNumber(
                              movement.durationSeconds,
                            ),

                          notes:
                            movement.notes.trim() ||
                            undefined,
                        }),
                      ),
                  }),
                ),
            }),
          ),
      };

      const response =
        await fetch(
          '/api/workouts',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        const message =
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ', ',
              )
            : data.message;

        setError(
          message ??
            t(
              'validation.createError',
            ),
        );

        return;
      }

      router.push(
        `/workouts/${data.id}`,
      );

      router.refresh();
    } catch {
      setError(
        t(
          'validation.createError',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const usedLevelKeys =
    variants
      .map(
        (variant) =>
          variant.levelKey,
      )
      .filter(Boolean);

  const canAddVariant =
    workoutLevels.length ===
      0 ||
    usedLevelKeys.length <
      workoutLevels.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <section className="rounded-xl border border-border bg-surface p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t(
              'details.eyebrow',
            )}
          </p>

          <h2 className="mt-1 text-xl font-bold">
            {t(
              'details.title',
            )}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {t(
              'details.description',
            )}
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'details.name',
              )}
            </label>

            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              placeholder={t(
                'details.namePlaceholder',
              )}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'details.workoutDescription',
              )}

              <span className="ml-1 font-normal text-muted">
                {t(
                  'optional',
                )}
              </span>
            </label>

            <textarea
              id="description"
              rows={3}
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              placeholder={t(
                'details.descriptionPlaceholder',
              )}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'details.type',
              )}
            </label>

            <select
              id="type"
              required
              value={typeKey}
              onChange={(
                event,
              ) =>
                setTypeKey(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="">
                {t(
                  'details.selectType',
                )}
              </option>

              {workoutTypes.map(
                (type) => (
                  <option
                    key={
                      type.key
                    }
                    value={
                      type.key
                    }
                  >
                    {getWorkoutTypeName(
                      type,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={
                isBenchmark
              }
              onChange={(
                event,
              ) =>
                setIsBenchmark(
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4 rounded border-border accent-[var(--accent)]"
            />

            <div>
              <p className="text-sm font-medium">
                {t(
                  'details.benchmark',
                )}
              </p>

              <p className="mt-0.5 text-xs text-muted">
                {t(
                  'details.benchmarkDescription',
                )}
              </p>
            </div>
          </label>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {t(
                'variants.eyebrow',
              )}
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {t(
                'variants.title',
              )}
            </h2>

            <p className="mt-1 text-sm text-muted">
              {t(
                'variants.description',
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              addVariant
            }
            disabled={
              !canAddVariant
            }
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            +{' '}
            {t(
              'variants.add',
            )}
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {variants.map(
            (
              variant,
              index,
            ) => (
              <WorkoutVariantForm
                key={
                  variant.id
                }
                variant={
                  variant
                }
                variantNumber={
                  index + 1
                }
                workoutTypes={
                  workoutTypes
                }
                workoutLevels={
                  workoutLevels
                }
                usedLevelKeys={
                  usedLevelKeys
                }
                canRemove={
                  variants.length >
                  1
                }
                onChange={(
                  updatedVariant,
                ) =>
                  updateVariant(
                    variant.id,
                    updatedVariant,
                  )
                }
                onRemove={() =>
                  removeVariant(
                    variant.id,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      <div className="sticky bottom-20 z-20 rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error ? (
              <p className="text-sm text-red-500">
                {error}
              </p>
            ) : (
              <p className="text-sm text-muted">
                {t(
                  'reviewBeforeSaving',
                )}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? t(
                  'creating',
                )
              : t(
                  'create',
                )}
          </button>
        </div>
      </div>
    </form>
  );
}