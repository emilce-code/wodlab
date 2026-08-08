'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutType } from '../page';
import WorkoutSectionForm, {
  WorkoutSectionFormState,
} from './WorkoutSectionForm';

type Props = {
  workoutTypes: WorkoutType[];
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

export default function WorkoutForm({
  workoutTypes,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [isBenchmark, setIsBenchmark] = useState(false);

  const [sections, setSections] = useState<WorkoutSectionFormState[]>([]);
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSections([createEmptySection()]);
  }, []);

  function addSection() {
    setSections((current) => [
      ...current,
      createEmptySection(),
    ]);
  }

  function removeSection(id: string) {
    setSections((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((section) => section.id !== id);
    });
  }

  function updateSection(
    id: string,
    updatedSection: WorkoutSectionFormState,
  ) {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? updatedSection : section,
      ),
    );
  }

  function optionalNumber(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    return Number(value);
  }

  function parseRepScheme(value: string): number[] {
    if (!value.trim()) {
      return [];
    }

    return value
      .split('-')
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  function validateForm(): string | null {
    if (!name.trim()) {
      return 'Workout name is required.';
    }

    if (!typeKey) {
      return 'Workout type is required.';
    }

    if (sections.length === 0) {
      return 'Add at least one workout section.';
    }

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];

      if (!section.typeKey) {
        return `Section ${sectionIndex + 1}: select a section type.`;
      }

      if (section.movements.length === 0) {
        return `Section ${sectionIndex + 1}: add at least one movement.`;
      }

      for (
        let movementIndex = 0;
        movementIndex < section.movements.length;
        movementIndex++
      ) {
        const movement = section.movements[movementIndex];

        if (!movement.movementId) {
          return `Section ${sectionIndex + 1}, movement ${
            movementIndex + 1
          }: select a movement.`;
        }
      }

      if (section.repScheme.trim()) {
        const parts = section.repScheme
          .split('-')
          .map((part) => part.trim());

        const valid = parts.every((part) => {
          if (!part) {
            return false;
          }

          const value = Number(part);

          return Number.isInteger(value) && value > 0;
        });

        if (!valid) {
          return `Section ${
            sectionIndex + 1
          }: rep scheme must contain positive numbers separated by hyphens, for example 21-15-9.`;
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

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        typeKey,
        isBenchmark,

        sections: sections.map((section, sectionIndex) => ({
          typeKey: section.typeKey,
          order: sectionIndex + 1,

          rounds: optionalNumber(section.rounds),
          durationSeconds: optionalNumber(section.durationSeconds),
          restSeconds: optionalNumber(section.restSeconds),

          repScheme: parseRepScheme(section.repScheme),

          notes: section.notes.trim() || undefined,

          movements: section.movements.map(
            (movement, movementIndex) => ({
              movementId: movement.movementId,
              order: movementIndex + 1,

              reps: optionalNumber(movement.reps),
              weight: optionalNumber(movement.weight),

              weightUnit:
                movement.weightUnit || undefined,

              distance: optionalNumber(movement.distance),
              calories: optionalNumber(movement.calories),
              durationSeconds: optionalNumber(
                movement.durationSeconds,
              ),

              notes: movement.notes.trim() || undefined,
            }),
          ),
        })),
      };

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        setError(message ?? 'Unable to create workout');
        return;
      }

      router.push(`/workouts/${data.id}`);
      router.refresh();
    } catch {
      setError('Unable to create workout');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">
          Workout details
        </h2>

        <div className="mt-5 grid gap-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium"
            >
              Workout name
            </label>

            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Fran"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={3}
              placeholder="Describe the workout..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium"
            >
              Workout type
            </label>

            <select
              id="type"
              required
              value={typeKey}
              onChange={(event) => setTypeKey(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-600"
            >
              <option value="">Select workout type</option>

              {workoutTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isBenchmark}
              onChange={(event) =>
                setIsBenchmark(event.target.checked)
              }
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            />

            Benchmark workout
          </label>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Workout sections
            </h2>

            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Add the blocks that make up this workout.
            </p>
          </div>

          <button
            type="button"
            onClick={addSection}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Add section
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {sections.map((section, index) => (
            <WorkoutSectionForm
              key={section.id}
              section={section}
              sectionNumber={index + 1}
              workoutTypes={workoutTypes}
              canRemove={sections.length > 1}
              onChange={(updatedSection) =>
                updateSection(section.id, updatedSection)
              }
              onRemove={() => removeSection(section.id)}
            />
          ))}
        </div>
      </section>
      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isSubmitting ? 'Creating workout...' : 'Create workout'}
        </button>
      </div>
    </form>
  );
}