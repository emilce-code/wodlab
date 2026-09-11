import {
  measurementTypes,
  movementCategories,
  prescriptionCategories,
  resultTypes,
  workoutLevels,
  workoutTypes,
} from './reference-data';
import { movements } from './movements';

function ensureUnique(
  values: readonly string[],
  label: string,
): void {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label} in seed data: "${value}"`);
    }

    seen.add(value);
  }
}

export function validateSeedData(): void {
  ensureUnique(
    movementCategories.map((value) => value.key),
    'movement category key',
  );
  ensureUnique(
    measurementTypes.map((value) => value.key),
    'measurement type key',
  );
  ensureUnique(
    workoutTypes.map((value) => value.key),
    'workout type key',
  );
  ensureUnique(
    resultTypes.map((value) => value.key),
    'result type key',
  );
  ensureUnique(
    workoutLevels.map((value) => value.key),
    'workout level key',
  );
  ensureUnique(
    prescriptionCategories.map((value) => value.key),
    'prescription category key',
  );
  ensureUnique(
    movements.map((movement) => movement.name),
    'movement name',
  );

  const movementCategoryKeys = new Set(
    movementCategories.map((category) => category.key),
  );
  const measurementTypeKeys = new Set(
    measurementTypes.map((measurementType) => measurementType.key),
  );
  const movementNames = new Set(
    movements.map((movement) => movement.name),
  );

  for (const movement of movements) {
    if (!movementCategoryKeys.has(movement.categoryKey)) {
      throw new Error(
        `Movement "${movement.name}" references unknown category "${movement.categoryKey}".`,
      );
    }

    for (const key of movement.measurementTypeKeys) {
      if (!measurementTypeKeys.has(key)) {
        throw new Error(
          `Movement "${movement.name}" references unknown measurement type "${key}".`,
        );
      }
    }

    if (
      movement.baseMovementName &&
      !movementNames.has(movement.baseMovementName)
    ) {
      throw new Error(
        `Movement "${movement.name}" references unknown base movement "${movement.baseMovementName}".`,
      );
    }

    if (movement.baseMovementName === movement.name) {
      throw new Error(
        `Movement "${movement.name}" cannot be its own base movement.`,
      );
    }
  }
}
