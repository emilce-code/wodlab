'use client';

import { useTranslations } from 'next-intl';

import type {
  PrescriptionCategory,
  WorkoutLevel,
  WorkoutType,
} from '../page';

import WorkoutSectionForm, {
  WorkoutSectionFormState,
} from './WorkoutSectionForm';

export type WorkoutVariantFormState = {
  id: string;
  levelKey: string;
  name: string;
  notes: string;
  sections: WorkoutSectionFormState[];
};

type Props = {
  variant: WorkoutVariantFormState;
  variantNumber: number;
  workoutTypes: WorkoutType[];
  workoutLevels: WorkoutLevel[];
  usedLevelKeys: string[];
  prescriptionCategories: PrescriptionCategory[];
  canRemove: boolean;
  onChange: (
    variant: WorkoutVariantFormState,
  ) => void;
  onRemove: () => void;
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

export default function WorkoutVariantForm({
  variant,
  variantNumber,
  workoutTypes,
  workoutLevels,
  usedLevelKeys,
  canRemove,
  prescriptionCategories,
  onChange,
  onRemove,
}: Props) {
  const t =
    useTranslations(
      'workouts.create.variants',
    );

  const selectedLevel =
    workoutLevels.find(
      (level) =>
        level.key ===
        variant.levelKey,
    );

  function update(
    field: keyof WorkoutVariantFormState,
    value: string,
  ) {
    onChange({
      ...variant,
      [field]: value,
    });
  }

  function addSection() {
    onChange({
      ...variant,
      sections: [
        ...variant.sections,
        createEmptySection(),
      ],
    });
  }

  function removeSection(
    id: string,
  ) {
    if (
      variant.sections.length ===
      1
    ) {
      return;
    }

    onChange({
      ...variant,
      sections:
        variant.sections.filter(
          (section) =>
            section.id !== id,
        ),
    });
  }

  function updateSection(
    id: string,
    updatedSection: WorkoutSectionFormState,
  ) {
    onChange({
      ...variant,
      sections:
        variant.sections.map(
          (section) =>
            section.id === id
              ? updatedSection
              : section,
        ),
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t('variant', {
              number:
                variantNumber,
            })}
          </p>

          <h3 className="mt-1 text-lg font-bold">
            {selectedLevel?.name ??
              t('configure')}
          </h3>

          {selectedLevel?.description && (
            <p className="mt-1 text-sm text-muted">
              {
                selectedLevel.description
              }
            </p>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-medium text-muted transition hover:text-red-500"
          >
            {t('remove')}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t('level')}
          </label>

          <select
            required
            value={
              variant.levelKey
            }
            onChange={(event) =>
              update(
                'levelKey',
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          >
            <option value="">
              {t('selectLevel')}
            </option>

            {workoutLevels.map(
              (level) => {
                const disabled =
                  level.key !==
                    variant.levelKey &&
                  usedLevelKeys.includes(
                    level.key,
                  );

                return (
                  <option
                    key={level.key}
                    value={level.key}
                    disabled={
                      disabled
                    }
                  >
                    {level.name}
                  </option>
                );
              },
            )}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t('name')}

            <span className="ml-1 font-normal text-muted">
              {t('optional')}
            </span>
          </label>

          <input
            type="text"
            value={variant.name}
            onChange={(event) =>
              update(
                'name',
                event.target.value,
              )
            }
            placeholder={t(
              'namePlaceholder',
            )}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t('notes')}

            <span className="ml-1 font-normal text-muted">
              {t('optional')}
            </span>
          </label>

          <textarea
            rows={2}
            value={
              variant.notes
            }
            onChange={(event) =>
              update(
                'notes',
                event.target.value,
              )
            }
            placeholder={t(
              'notesPlaceholder',
            )}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>

      <div className="my-6 border-t border-border" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-semibold">
            {t('sections')}
          </h4>

          <p className="mt-1 text-sm text-muted">
            {t(
              'sectionsDescription',
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-elevated"
        >
          + {t('addSection')}
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {variant.sections.map(
          (
            section,
            index,
          ) => (
            <WorkoutSectionForm
              key={section.id}
              section={section}
              sectionNumber={
                index + 1
              }
              workoutTypes={
                workoutTypes
              }
              canRemove={
                variant.sections
                  .length > 1
              }
              prescriptionCategories={prescriptionCategories}
              onChange={(
                updatedSection,
              ) =>
                updateSection(
                  section.id,
                  updatedSection,
                )
              }
              onRemove={() =>
                removeSection(
                  section.id,
                )
              }
            />
          ),
        )}
      </div>
    </section>
  );
}