'use client';

import { useEffect, useState } from 'react';

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
};

type Props = {
  movement: WorkoutMovementFormState;
  canRemove: boolean;
  onChange: (movement: WorkoutMovementFormState) => void;
  onRemove: () => void;
};

export default function WorkoutMovementForm({
  movement,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const [search, setSearch] = useState(movement.movementName);
  const [results, setResults] = useState<MovementOption[]>([]);
  const [selectedMovement, setSelectedMovement] =
    useState<MovementOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const normalizedSearch = search.trim();

    if (normalizedSearch.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/movements?search=${encodeURIComponent(normalizedSearch)}`,
        );

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as MovementOption[];
        setResults(data);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  function update(
    field: keyof WorkoutMovementFormState,
    value: string,
  ) {
    onChange({
      ...movement,
      [field]: value,
    });
  }

  function selectMovement(option: MovementOption) {
    setSelectedMovement(option);
    setSearch(option.name);
    setResults([]);

    onChange({
      ...movement,
      movementId: option.id,
      movementName: option.name,
    });
  }

  const supportsReps =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === 'REPS',
    ) ?? false;

  const supportsWeight =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === 'WEIGHT',
    ) ?? false;

  const supportsDistance =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === 'DISTANCE',
    ) ?? false;

  const supportsCalories =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === 'CALORIES',
    ) ?? false;

  const supportsDuration =
    selectedMovement?.measurementTypes.some(
      (type) => type.key === 'DURATION',
    ) ?? false;

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div className="relative flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Movement
          </label>

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);

              if (event.target.value !== movement.movementName) {
                setSelectedMovement(null);

                onChange({
                  ...movement,
                  movementId: '',
                  movementName: '',
                });
              }
            }}
            placeholder="Search movements..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />

          {isSearching && (
            <p className="mt-2 text-xs text-zinc-500">
              Searching...
            </p>
          )}

          {results.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {results.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectMovement(option)}
                  className="block w-full border-b border-zinc-100 px-4 py-3 text-left last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  <div className="font-medium">
                    {option.name}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {option.category.name}
                  </div>

                  {option.aliases.length > 0 && (
                    <div className="mt-1 text-xs text-zinc-500">
                      {option.aliases.join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-7 text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400"
          >
            Remove
          </button>
        )}
      </div>

      {selectedMovement && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {supportsReps && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Reps
              </label>

              <input
                type="number"
                min="1"
                value={movement.reps}
                onChange={(event) =>
                  update('reps', event.target.value)
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          )}

          {supportsWeight && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Weight
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={movement.weight}
                  onChange={(event) =>
                    update('weight', event.target.value)
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Weight unit
                </label>

                <select
                  value={movement.weightUnit}
                  onChange={(event) =>
                    update('weightUnit', event.target.value)
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Select unit</option>
                  <option value="KG">KG</option>
                  <option value="LB">LB</option>
                </select>
              </div>
            </>
          )}

          {supportsDistance && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Distance
              </label>

              <input
                type="number"
                min="0"
                value={movement.distance}
                onChange={(event) =>
                  update('distance', event.target.value)
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          )}

          {supportsCalories && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Calories
              </label>

              <input
                type="number"
                min="0"
                value={movement.calories}
                onChange={(event) =>
                  update('calories', event.target.value)
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          )}

          {supportsDuration && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Duration (seconds)
              </label>

              <input
                type="number"
                min="0"
                value={movement.durationSeconds}
                onChange={(event) =>
                  update(
                    'durationSeconds',
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Notes
            </label>

            <input
              value={movement.notes}
              onChange={(event) =>
                update('notes', event.target.value)
              }
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}