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

export default function WorkoutSectionForm({
  section,
  sectionNumber,
  workoutTypes,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  function update(
    field: keyof WorkoutSectionFormState,
    value: string,
  ) {
    onChange({
      ...section,
      [field]: value,
    });
  }

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
        movement.id === id ? updatedMovement : movement,
        ),
    });
    }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Section {sectionNumber}
        </h3>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Section type
          </label>

          <select
            required
            value={section.typeKey}
            onChange={(event) =>
              update('typeKey', event.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Select type</option>

            {workoutTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Rounds
          </label>

          <input
            type="number"
            min="1"
            value={section.rounds}
            onChange={(event) =>
              update('rounds', event.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Duration (seconds)
          </label>

          <input
            type="number"
            min="1"
            value={section.durationSeconds}
            onChange={(event) =>
              update('durationSeconds', event.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Rest (seconds)
          </label>

          <input
            type="number"
            min="0"
            value={section.restSeconds}
            onChange={(event) =>
              update('restSeconds', event.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Rep scheme
          </label>

          <input
            value={section.repScheme}
            onChange={(event) =>
              update('repScheme', event.target.value)
            }
            placeholder="Example: 21-15-9"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Enter reps separated by hyphens.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Notes
          </label>

          <textarea
            rows={3}
            value={section.notes}
            onChange={(event) =>
              update('notes', event.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="md:col-span-2 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-medium">
                Movements
              </h4>

              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Add the movements included in this section.
              </p>
            </div>

            <button
              type="button"
              onClick={addMovement}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Add movement
            </button>
          </div>

          {section.movements.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No movements added yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {section.movements.map((movement) => (
                <WorkoutMovementForm
                  key={movement.id}
                  movement={movement}
                  canRemove
                  onChange={(updatedMovement) =>
                    updateMovement(
                      movement.id,
                      updatedMovement,
                    )
                  }
                  onRemove={() =>
                    removeMovement(movement.id)
                  }
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}