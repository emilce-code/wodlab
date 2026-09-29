import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type CatalogMovement = {
  id: string;
  name: string;
  aliases: string[];
  category: { key: string; name: string };
  measurementTypes: Array<{
    measurementType: { key: string; name: string };
  }>;
};

type ImportIssue = {
  line: number;
  code: 'AMBIGUOUS_MOVEMENT' | 'UNKNOWN_MOVEMENT' | 'MULTIPLE_LOADS';
  source: string;
  candidates: Array<{ id: string; name: string }>;
};

type ParsedPrescription = {
  categoryKey: 'MEN' | 'WOMEN';
  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
};

type ParsedMovement = {
  sourceLine: number;
  source: string;
  matchStatus: 'MATCHED' | 'AMBIGUOUS' | 'UNRESOLVED';
  candidates: Array<{ id: string; name: string }>;
  movement: {
    id: string;
    name: string;
    aliases: string[];
    category: { key: string; name: string };
    measurementTypes: Array<{ key: string; name: string }>;
  } | null;
  reps: number | null;
  weight: number | null;
  weightUnit: 'KG' | 'LB' | null;
  distance: number | null;
  calories: number | null;
  durationSeconds: number | null;
  notes: string | null;
  prescriptions: ParsedPrescription[];
};

type SectionRole =
  'WARM_UP' | 'STRENGTH' | 'WOD' | 'ACCESSORY' | 'COOLDOWN' | 'CUSTOM';

type ParsedSection = {
  typeKey: string;
  role: SectionRole;
  rounds: number | null;
  durationSeconds: number | null;
  restSeconds: null;
  repScheme: number[];
  notes: string | null;
  movements: ParsedMovement[];
};

const levelAliases: Record<string, string> = {
  rx: 'RX',
  intermediate: 'INTERMEDIATE',
  intermedio: 'INTERMEDIATE',
  intermediario: 'INTERMEDIATE',
  beginner: 'BEGINNER',
  begginer: 'BEGINNER',
  principiante: 'BEGINNER',
  iniciante: 'BEGINNER',
};

const categoryAliases: Record<string, 'MEN' | 'WOMEN'> = {
  men: 'MEN',
  man: 'MEN',
  male: 'MEN',
  hombre: 'MEN',
  hombres: 'MEN',
  masculino: 'MEN',
  masculinos: 'MEN',
  homem: 'MEN',
  homens: 'MEN',
  women: 'WOMEN',
  woman: 'WOMEN',
  female: 'WOMEN',
  mujer: 'WOMEN',
  mujeres: 'WOMEN',
  femenino: 'WOMEN',
  femeninos: 'WOMEN',
  feminino: 'WOMEN',
  femininos: 'WOMEN',
  feminina: 'WOMEN',
  femininas: 'WOMEN',
  mulher: 'WOMEN',
  mulheres: 'WOMEN',
};

const sectionRoleAliases: Record<string, SectionRole> = {
  'warm up': 'WARM_UP',
  warmup: 'WARM_UP',
  calentamiento: 'WARM_UP',
  aquecimento: 'WARM_UP',
  strength: 'STRENGTH',
  fuerza: 'STRENGTH',
  forca: 'STRENGTH',
  wod: 'WOD',
  metcon: 'WOD',
  conditioning: 'WOD',
  condicionamiento: 'WOD',
  condicionamento: 'WOD',
  accessory: 'ACCESSORY',
  accesorios: 'ACCESSORY',
  accesorio: 'ACCESSORY',
  acessorio: 'ACCESSORY',
  acessorios: 'ACCESSORY',
  'cool down': 'COOLDOWN',
  cooldown: 'COOLDOWN',
  'vuelta a la calma': 'COOLDOWN',
  enfriamiento: 'COOLDOWN',
  desaquecimento: 'COOLDOWN',
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function singularizeToken(token: string) {
  if (token.length <= 3) return token;
  if (token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ches') || token.endsWith('shes')) {
    return token.slice(0, -2);
  }
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function matchValue(value: string) {
  return normalize(value)
    .split(' ')
    .map((token) => {
      if (token === 'dumbbell') return 'db';
      if (token === 'kipping') return 'kip';
      return singularizeToken(token);
    })
    .join(' ');
}

function headerValue(value: string) {
  return normalize(value.replace(/^#+\s*/, '').replace(/[:\s]+$/, ''));
}

function detectLevel(value: string) {
  return levelAliases[headerValue(value)] ?? null;
}

function detectCategory(value: string) {
  return categoryAliases[headerValue(value)] ?? null;
}

function detectSectionRole(value: string): SectionRole | null {
  const header = headerValue(value);
  const direct = sectionRoleAliases[header];
  if (direct) return direct;

  const prefix = normalize(
    value.replace(/^#+\s*/, '').split(/\s*[-:–—]\s*/)[0],
  );
  return sectionRoleAliases[prefix] ?? null;
}

function typeForSection(
  role: SectionRole,
  value: string,
  fallbackType: string,
) {
  const detected = detectType(value);
  if (detected !== 'CUSTOM') return detected;
  if (role === 'STRENGTH') return 'STRENGTH';
  if (role === 'WOD')
    return fallbackType === 'STRENGTH' ? 'CUSTOM' : fallbackType;
  return 'CUSTOM';
}

function splitCategoryPrefix(value: string) {
  const match = value.match(/^([^:–—-]+)\s*[:–—-]\s*(.+)$/);

  if (!match) return { categoryKey: null, value };

  const categoryKey = categoryAliases[normalize(match[1])];

  return categoryKey
    ? { categoryKey, value: match[2].trim() }
    : { categoryKey: null, value };
}

function durationSeconds(text: string) {
  const match = text.match(/\b(\d+)\s*(?:min(?:ute)?s?|')\b/i);
  if (match) return Number(match[1]) * 60;

  const shorthand = text.match(/\b(?:amrap|emom)\s+(\d+)\b/i);
  return shorthand ? Number(shorthand[1]) * 60 : null;
}

function detectType(text: string) {
  if (/\bamrap\b/i.test(text)) return 'AMRAP';
  if (/\bemom\b|every minute/i.test(text)) return 'EMOM';
  if (/\bfor time\b/i.test(text)) return 'FOR_TIME';
  if (/\bmax (?:reps?|rounds?)\b/i.test(text)) return 'MAX_REPS';
  if (/\b(?:strength|heavy|1rm|3rm|5rm)\b/i.test(text)) return 'STRENGTH';
  if (/\binterval/i.test(text)) return 'INTERVAL';
  return 'CUSTOM';
}

function isDirective(line: string) {
  if (detectSectionRole(line)) {
    return true;
  }

  return /^(?:(?:wod|metcon|conditioning|strength|warm[-\s]?up)\s*[-:–—]\s*)?(?:amrap|emom|for time|max (?:reps?|rounds?)|every minute|\d+\s*(?:min(?:ute)?s?\s+)?(?:amrap|emom)\b|\d+\s+rounds?\b|\d+\s+sets?\b)/i.test(
    line,
  );
}

function numericValues(value: string) {
  const reps = value.match(
    /^[-•*]?\s*(\d+)\s*(?:x|reps?)?\s+(?!m\b|meters?\b|cal\b|calories?\b|sec\b|seconds?\b)/i,
  );
  const distance = value.match(/^[-•*]?\s*(\d+)\s*(?:m|meters?)\s+/i);
  const calories = value.match(/^[-•*]?\s*(\d+)\s*(?:cal|calories?)\s+/i);
  const load = value.match(/(?:@\s*)?(\d+(?:\.\d+)?)\s*(kg|kgs|lb|lbs)\b/i);

  return {
    reps: reps ? Number(reps[1]) : null,
    weight: load ? Number(load[1]) : null,
    weightUnit: load
      ? load[2].toLowerCase().startsWith('k')
        ? ('KG' as const)
        : ('LB' as const)
      : null,
    distance: distance ? Number(distance[1]) : null,
    calories: calories ? Number(calories[1]) : null,
    durationSeconds: null,
  };
}

function movementCandidate(value: string) {
  return value
    .replace(/^[-•*]\s*/, '')
    .replace(/^\d+\s*(?:x|reps?)?\s+/i, '')
    .replace(/^\d+\s*(?:m|meters?|cal(?:ories)?|sec(?:onds?)?)\s+/i, '')
    .replace(
      /(?:@\s*)?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:kg|kgs|lb|lbs)\b.*$/i,
      '',
    )
    .trim();
}

@Injectable()
export class WorkoutImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async parse(text: string) {
    const catalog = await this.prisma.movement.findMany({
      select: {
        id: true,
        name: true,
        aliases: true,
        category: { select: { key: true, name: true } },
        measurementTypes: {
          select: {
            measurementType: { select: { key: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return this.parseWithCatalog(text, catalog);
  }

  parseWithCatalog(text: string, catalog: CatalogMovement[]) {
    const lines = text
      .split(/\r?\n/)
      .map((line, index) => ({ value: line.trim(), number: index + 1 }))
      .filter((line) => line.value.length > 0);
    const fullText = lines.map((line) => line.value).join('\n');
    const typeKey = detectType(fullText);
    const directiveIndex = lines.findIndex((line) => isDirective(line.value));
    const nameLine = lines.find((line, index) => {
      return (
        index < (directiveIndex < 0 ? 1 : directiveIndex) &&
        !isDirective(line.value) &&
        !detectLevel(line.value) &&
        !detectCategory(line.value)
      );
    });
    const name = nameLine?.value ?? 'Imported workout';
    const repSchemeMatch = fullText.match(/\b(\d+(?:\s*[-–—]\s*\d+){1,})\b/);
    const repScheme = repSchemeMatch
      ? repSchemeMatch[1].split(/\s*[-–—]\s*/).map(Number)
      : [];
    const roundsMatch = fullText.match(/\b(\d+)\s+rounds?\b/i);
    const issues: ImportIssue[] = [];
    const variantSections = new Map<string, ParsedSection[]>();
    let currentLevel = 'RX';
    let currentCategory: 'MEN' | 'WOMEN' | null = null;
    let currentRole: SectionRole = 'WOD';

    const createSection = (
      role: SectionRole,
      source: string,
      movements: ParsedMovement[] = [],
    ): ParsedSection => ({
      typeKey: typeForSection(role, source, typeKey),
      role,
      rounds: /\b(\d+)\s+rounds?\b/i.test(source)
        ? Number(source.match(/\b(\d+)\s+rounds?\b/i)?.[1])
        : null,
      durationSeconds: durationSeconds(source),
      restSeconds: null,
      repScheme: /\b(\d+(?:\s*[-–—]\s*\d+){1,})\b/.test(source)
        ? (source.match(/\b(\d+(?:\s*[-–—]\s*\d+){1,})\b/)?.[1] ?? '')
            .split(/\s*[-–—]\s*/)
            .filter(Boolean)
            .map(Number)
        : [],
      notes: null,
      movements,
    });

    const sectionsForLevel = (level: string) => {
      const existing = variantSections.get(level);
      if (existing) return existing;

      const sections = [createSection(currentRole, fullText)];
      variantSections.set(level, sections);
      return sections;
    };

    const currentSection = () => {
      const sections = sectionsForLevel(currentLevel);
      return sections[sections.length - 1];
    };

    for (const line of lines) {
      const level = detectLevel(line.value);
      if (level) {
        currentLevel = level;
        currentCategory = null;
        currentRole = 'WOD';
        continue;
      }

      const sectionRole = detectSectionRole(line.value);
      if (sectionRole) {
        currentRole = sectionRole;
        currentCategory = null;
        const sections = sectionsForLevel(currentLevel);
        const nextSection = createSection(sectionRole, line.value);
        if (
          sections.length === 1 &&
          sections[0].movements.length === 0 &&
          sections[0].role === 'WOD'
        ) {
          sections[0] = nextSection;
        } else {
          sections.push(nextSection);
        }
        continue;
      }

      const categoryHeader = detectCategory(line.value);
      if (categoryHeader) {
        currentCategory = categoryHeader;
        continue;
      }

      const section = currentSection();

      if (isDirective(line.value)) {
        section.typeKey = typeForSection(section.role, line.value, typeKey);
        section.rounds =
          section.rounds ??
          (/\b(\d+)\s+rounds?\b/i.test(line.value)
            ? Number(line.value.match(/\b(\d+)\s+rounds?\b/i)?.[1])
            : null);
        section.durationSeconds =
          section.durationSeconds ?? durationSeconds(line.value);
        continue;
      }

      const lineRepScheme = line.value.match(/\b(\d+(?:\s*[-–—]\s*\d+){1,})\b/);
      if (lineRepScheme?.[0] === line.value) {
        section.repScheme = lineRepScheme[1].split(/\s*[-–—]\s*/).map(Number);
        continue;
      }

      if (line.value === name) {
        continue;
      }

      const prefixed = splitCategoryPrefix(line.value);
      const categoryKey = prefixed.categoryKey ?? currentCategory;
      const candidateText = movementCandidate(prefixed.value);
      const normalized = matchValue(candidateText);

      if (!normalized) continue;

      const exact = catalog.filter((movement) =>
        [movement.name, ...movement.aliases].some(
          (label) => matchValue(label) === normalized,
        ),
      );
      const possible = exact.length
        ? exact
        : catalog.filter((movement) =>
            [movement.name, ...movement.aliases].some((label) => {
              const value = matchValue(label);
              return value.includes(normalized) || normalized.includes(value);
            }),
          );
      const preferred =
        normalized === 'toe to bar'
          ? possible.find((movement) => movement.name === 'Kipping Toes-to-bar')
          : null;
      const match = preferred ?? (possible.length === 1 ? possible[0] : null);

      if (!match) {
        issues.push({
          line: line.number,
          code: possible.length ? 'AMBIGUOUS_MOVEMENT' : 'UNKNOWN_MOVEMENT',
          source: line.value,
          candidates: possible
            .slice(0, 5)
            .map(({ id, name }) => ({ id, name })),
        });
      }

      if (
        /\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*(?:kg|kgs|lb|lbs)\b/i.test(
          prefixed.value,
        )
      ) {
        issues.push({
          line: line.number,
          code: 'MULTIPLE_LOADS',
          source: line.value,
          candidates: [],
        });
      }

      const values = numericValues(prefixed.value);
      const movements = section.movements;
      const identity = match?.id ?? normalized;
      let movement = movements.find(
        (item) =>
          (item.movement?.id ?? matchValue(item.notes ?? '')) === identity,
      );

      if (!movement) {
        movement = {
          sourceLine: line.number,
          source: line.value,
          matchStatus: match
            ? 'MATCHED'
            : possible.length
              ? 'AMBIGUOUS'
              : 'UNRESOLVED',
          candidates: possible
            .slice(0, 5)
            .map(({ id, name }) => ({ id, name })),
          movement: match
            ? {
                id: match.id,
                name: match.name,
                aliases: match.aliases,
                category: match.category,
                measurementTypes: match.measurementTypes.map(
                  ({ measurementType }) => measurementType,
                ),
              }
            : null,
          reps: categoryKey ? null : values.reps,
          weight: categoryKey ? null : values.weight,
          weightUnit: categoryKey ? null : values.weightUnit,
          distance: categoryKey ? null : values.distance,
          calories: categoryKey ? null : values.calories,
          durationSeconds: categoryKey ? null : values.durationSeconds,
          notes: match ? null : candidateText,
          prescriptions: [],
        };
        movements.push(movement);
      }

      if (categoryKey) {
        const prescription: ParsedPrescription = {
          categoryKey,
          ...values,
          notes: null,
        };
        const existingIndex = movement.prescriptions.findIndex(
          (item) => item.categoryKey === categoryKey,
        );

        if (existingIndex >= 0) {
          movement.prescriptions[existingIndex] = prescription;
        } else {
          movement.prescriptions.push(prescription);
        }
      }
    }

    for (const sections of variantSections.values()) {
      if (sections.length === 1 && sections[0].movements.length === 0) {
        sections[0] = {
          ...sections[0],
          typeKey,
          role: 'WOD',
          rounds: roundsMatch ? Number(roundsMatch[1]) : null,
          durationSeconds: durationSeconds(fullText),
          repScheme,
        };
      }
    }

    const fallbackSection = createSection('WOD', fullText);
    fallbackSection.typeKey = typeKey;
    fallbackSection.rounds = roundsMatch ? Number(roundsMatch[1]) : null;
    fallbackSection.durationSeconds = durationSeconds(fullText);
    fallbackSection.repScheme = repScheme;

    const variants = [...variantSections.entries()].map(
      ([levelKey, sections]) => ({
        levelKey,
        name: null,
        notes: null,
        section:
          sections.find((section) => section.role === 'WOD') ?? sections[0],
        sections,
      }),
    );
    const allMovements = variants.flatMap((variant) =>
      variant.sections.flatMap((section) => section.movements),
    );

    return {
      sourceText: text,
      draft: {
        name,
        description: null,
        typeKey,
        section: variants[0]?.section ?? fallbackSection,
        sections: variants[0]?.sections ?? [fallbackSection],
        variants,
      },
      summary: {
        totalLines: lines.length,
        detectedVariants: variants.length,
        detectedPrescriptions: allMovements.reduce(
          (total, movement) => total + movement.prescriptions.length,
          0,
        ),
        matchedMovements: allMovements.filter(
          (item) => item.matchStatus === 'MATCHED',
        ).length,
        unresolvedMovements: allMovements.filter(
          (item) => item.matchStatus !== 'MATCHED',
        ).length,
      },
      issues,
    };
  }
}
