const FALLBACK_LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "RX"] as const;

type VariantWithLevel = {
  level: {
    key: string;
  };
};

type SelectWorkoutVariantOptions = {
  preferredLevelKey?: string | null;
  requestedLevelKey?: string | null;
};

export function selectWorkoutVariant<T extends VariantWithLevel>(
  variants: T[],
  options: SelectWorkoutVariantOptions = {},
): T | null {
  if (variants.length === 0) {
    return null;
  }

  const requestedLevelKey = options.requestedLevelKey?.toUpperCase();

  if (requestedLevelKey) {
    const requestedVariant = variants.find(
      (variant) => variant.level.key.toUpperCase() === requestedLevelKey,
    );

    if (requestedVariant) {
      return requestedVariant;
    }
  }

  const preferredLevelKey = options.preferredLevelKey?.toUpperCase();

  if (preferredLevelKey) {
    const preferredVariant = variants.find(
      (variant) => variant.level.key.toUpperCase() === preferredLevelKey,
    );

    if (preferredVariant) {
      return preferredVariant;
    }
  }

  for (const levelKey of FALLBACK_LEVEL_ORDER) {
    const fallbackVariant = variants.find(
      (variant) => variant.level.key.toUpperCase() === levelKey,
    );

    if (fallbackVariant) {
      return fallbackVariant;
    }
  }

  return variants[0];
}
