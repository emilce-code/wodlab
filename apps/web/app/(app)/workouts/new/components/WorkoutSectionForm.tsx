'use client';

import WorkoutMovementForm, {
  WorkoutMovementFormState,
} from './WorkoutMovementForm';

export type WorkoutSectionFormState = {
  id: string;
  typeKey: string;
  rounds: string;
  durationSeconds: string;
  restSeconds: string;
  repScheme: string;
  notes: string;
  movements: WorkoutMovementFormState[];
};

type WorkoutType = {
  key: string;
  name: string;
  description: string | null;
};

type Props = {
  section: WorkoutSectionFormState;
  sectionNumber: number;
  workoutTypes: WorkoutType[];
  canRemove: boolean;
  onChange: (section: WorkoutSectionFormState) => void;
  onRemove: () => void;
};

function createEmptyMovement(): WorkoutMovementFormState {
  return {
    id: crypto.randomUUID(),
    movementId: '',
    movementName: '',
    reps: '',
    weight: '',
    weightUnit: '',
    distance: '',
    calories: '',
    durationSeconds: '',
    notes: '',
  };
}

export default function WorkoutSectionForm({
  section,
  sectionNumber,
  workoutTypes,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const sectionType = section.typeKey;

  const selectedSectionType = workoutTypes.find(
    (type) => type.key === sectionType,
  );

  const showRounds =
    sectionType === 'STRENGTH' ||
    sectionType === 'INTERVAL' ||
    sectionType === 'CUSTOM';

  const showDuration =
    sectionType === 'AMRAP' ||
    sectionType === 'EMOM' ||
    sectionType === 'INTERVAL' ||
    sectionType === 'CUSTOM';

  const showRest =
    sectionType === 'INTERVAL' ||
    sectionType === 'CUSTOM';

  const showRepScheme =
    sectionType === 'FOR_TIME' ||
    sectionType === 'MAX_REPS' ||
    sectionType === 'CUSTOM';

  function update(
    field: keyof WorkoutSectionFormState,
    value: string,
  ) {
    onChange({
      ...section,
      [field]: value,
    });
  }

  function changeSectionType(typeKey: string) {
    const nextSection: WorkoutSectionFormState = {
      ...section,
      typeKey,
    };

    // Rounds / Sets
    if (
      typeKey !== 'STRENGTH' &&
      typeKey !== 'INTERVAL' &&
      typeKey !== 'CUSTOM'
    ) {
      nextSection.rounds = '';
    }

    // Duration
    if (
      typeKey !== 'AMRAP' &&
      typeKey !== 'EMOM' &&
      typeKey !== 'INTERVAL' &&
      typeKey !== 'CUSTOM'
    ) {
      nextSection.durationSeconds = '';
    }

    // Rest
    if (
      typeKey !== 'INTERVAL' &&
      typeKey !== 'CUSTOM'
    ) {
      nextSection.restSeconds = '';
    }

    // Rep scheme
    if (
      typeKey !== 'FOR_TIME' &&
      typeKey !== 'MAX_REPS' &&
      typeKey !== 'CUSTOM'
    ) {
      nextSection.repScheme = '';
    }

    onChange(nextSection);
  }

  function addMovement() {
    onChange({
      ...section,
      movements: [
        ...section.movements,
        createEmptyMovement(),
      ],
    });
  }

  function removeMovement(id: string) {
    onChange({
      ...section,
      movements: section.movements.filter(
        (movement) => movement.id !== id,
      ),
    });
  }

  function updateMovement(
    id: string,
    updatedMovement: WorkoutMovementFormState,
  ) {
    onChange({
      ...section,
      movements: section.movements.map((movement) =>
        movement.id === id
          ? updatedMovement
          : movement,
      ),
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Section {sectionNumber}
          </p>

          <h3 className="mt-1 text-lg font-bold">
            {selectedSectionType?.name ??
              'Configure section'}
          </h3>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-medium text-muted transition hover:text-red-500"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Section type */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Section type
          </label>

          <select
            required
            value={section.typeKey}
            onChange={(event) =>
              changeSectionType(event.target.value)
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          >
            <option value="">
              Select section type
            </option>

            {workoutTypes.map((type) => (
              <option
                key={type.key}
                value={type.key}
              >
                {type.name}
              </option>
            ))}
          </select>

          {selectedSectionType?.description && (
            <p className="mt-2 text-xs text-muted">
              {selectedSectionType.description}
            </p>
          )}
        </div>

        {/* Rounds / Sets */}
        {showRounds && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {sectionType === 'STRENGTH'
                ? 'Sets'
                : 'Rounds'}
            </label>

            <input
              type="number"
              min="1"
              value={section.rounds}
              onChange={(event) =>
                update(
                  'rounds',
                  event.target.value,
                )
              }
              placeholder={
                sectionType === 'STRENGTH'
                  ? '5'
                  : '3'
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>
        )}

        {/* Duration */}
        {showDuration && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Duration
            </label>

            <div className="relative">
              <input
                type="number"
                min="1"
                value={
                  section.durationSeconds
                    ? Number(
                        section.durationSeconds,
                      ) / 60
                    : ''
                }
                onChange={(event) => {
                  const minutes =
                    event.target.value;

                  update(
                    'durationSeconds',
                    minutes
                      ? String(
                          Number(minutes) * 60,
                        )
                      : '',
                  );
                }}
                placeholder="20"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-20 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                minutes
              </span>
            </div>
          </div>
        )}

        {/* Rest */}
        {showRest && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Rest
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                value={section.restSeconds}
                onChange={(event) =>
                  update(
                    'restSeconds',
                    event.target.value,
                  )
                }
                placeholder="60"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-20 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                seconds
              </span>
            </div>
          </div>
        )}

        {/* Rep scheme */}
        {showRepScheme && (
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Rep scheme
            </label>

            <input
              type="text"
              value={section.repScheme}
              onChange={(event) =>
                update(
                  'repScheme',
                  event.target.value,
                )
              }
              placeholder="21-15-9"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />

            <p className="mt-2 text-xs text-muted">
              Enter reps separated by hyphens, for
              example 21-15-9.
            </p>
          </div>
        )}

        {/* Movements */}
        <div className="md:col-span-2">
          <div className="my-2 border-t border-border" />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold">
                Movements
              </h4>

              <p className="mt-1 text-sm text-muted">
                Add the movements included in this
                section.
              </p>
            </div>

            <button
              type="button"
              onClick={addMovement}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-elevated"
            >
              + Add movement
            </button>
          </div>

          {section.movements.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border px-6 py-8 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-semibold text-accent">
                +
              </div>

              <p className="mt-3 text-sm font-semibold">
                No movements yet
              </p>

              <p className="mt-1 text-xs text-muted">
                Add the first movement for this
                section.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {section.movements.map(
                (movement, index) => (
                  <div key={movement.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Movement {index + 1}
                      </span>
                    </div>

                    <WorkoutMovementForm
                      movement={movement}
                      canRemove
                      onChange={(
                        updatedMovement,
                      ) =>
                        updateMovement(
                          movement.id,
                          updatedMovement,
                        )
                      }
                      onRemove={() =>
                        removeMovement(
                          movement.id,
                        )
                      }
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <div className="my-2 border-t border-border" />

          <label className="mb-1.5 mt-6 block text-sm font-medium">
            Notes
            <span className="ml-1 font-normal text-muted">
              (optional)
            </span>
          </label>

          <textarea
            rows={3}
            value={section.notes}
            onChange={(event) =>
              update(
                'notes',
                event.target.value,
              )
            }
            placeholder="Add instructions or notes for this section..."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
        </div>
      </div>
    </section>
  );
}