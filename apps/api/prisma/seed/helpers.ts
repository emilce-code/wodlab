export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[-_/]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildMovementSearchText(
  name: string,
  aliases: readonly string[],
): string {
  return normalizeSearchText([name, ...aliases].join(' '));
}

export function requireId(
  map: Map<string, string>,
  key: string,
  entityName: string,
): string {
  const id = map.get(key);

  if (!id) {
    throw new Error(`${entityName} "${key}" was not found while seeding.`);
  }

  return id;
}

export function requireValue<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}
