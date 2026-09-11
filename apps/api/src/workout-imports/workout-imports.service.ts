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

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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
  return /^(?:amrap|emom|for time|max (?:reps?|rounds?)|every minute|\d+\s+rounds?\b)/i.test(
    line,
  );
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
        !isDirective(line.value)
      );
    });
    const name = nameLine?.value ?? 'Imported workout';
    const repSchemeMatch = fullText.match(/\b(\d+(?:\s*[-–—]\s*\d+){1,})\b/);
    const repScheme = repSchemeMatch
      ? repSchemeMatch[1].split(/\s*[-–—]\s*/).map(Number)
      : [];
    const roundsMatch = fullText.match(/\b(\d+)\s+rounds?\b/i);
    const issues: Array<{
      line: number;
      code: 'AMBIGUOUS_MOVEMENT' | 'UNKNOWN_MOVEMENT' | 'MULTIPLE_LOADS';
      source: string;
      candidates: Array<{ id: string; name: string }>;
    }> = [];

    const movements = lines.flatMap((line, index) => {
      if (
        line.value === name ||
        isDirective(line.value) ||
        repSchemeMatch?.[0] === line.value
      ) {
        return [];
      }
      const candidateText = line.value
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\s*(?:x|reps?)?\s+/i, '')
        .replace(/^\d+\s*(?:m|meters?|cal(?:ories)?|sec(?:onds?)?)\s+/i, '')
        .replace(
          /(?:@\s*)?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*(?:kg|kgs|lb|lbs)\b.*$/i,
          '',
        )
        .trim();
      const normalized = normalize(candidateText);
      if (!normalized || (index === 0 && !nameLine)) return [];

      const exact = catalog.filter((movement) =>
        [movement.name, ...movement.aliases].some(
          (label) => normalize(label) === normalized,
        ),
      );
      const possible = exact.length
        ? exact
        : catalog.filter((movement) =>
            [movement.name, ...movement.aliases].some((label) => {
              const value = normalize(label);
              return value.includes(normalized) || normalized.includes(value);
            }),
          );
      const match = possible.length === 1 ? possible[0] : null;
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
          line.value,
        )
      ) {
        issues.push({
          line: line.number,
          code: 'MULTIPLE_LOADS',
          source: line.value,
          candidates: [],
        });
      }
      const reps = line.value.match(
        /^[-•*]?\s*(\d+)\s*(?:x|reps?)?\s+(?!m\b|meters?\b|cal\b|calories?\b|sec\b|seconds?\b)/i,
      );
      const distance = line.value.match(/^[-•*]?\s*(\d+)\s*(?:m|meters?)\s+/i);
      const calories = line.value.match(
        /^[-•*]?\s*(\d+)\s*(?:cal|calories?)\s+/i,
      );
      const load = line.value.match(
        /(?:@\s*)?(\d+(?:\.\d+)?)\s*(kg|kgs|lb|lbs)\b/i,
      );
      return [
        {
          sourceLine: line.number,
          source: line.value,
          matchStatus: match
            ? ('MATCHED' as const)
            : possible.length
              ? ('AMBIGUOUS' as const)
              : ('UNRESOLVED' as const),
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
          reps: reps ? Number(reps[1]) : null,
          weight: load ? Number(load[1]) : null,
          weightUnit: load
            ? load[2].toLowerCase().startsWith('k')
              ? 'KG'
              : 'LB'
            : null,
          distance: distance ? Number(distance[1]) : null,
          calories: calories ? Number(calories[1]) : null,
          durationSeconds: null,
          notes: match ? null : candidateText,
        },
      ];
    });

    return {
      sourceText: text,
      draft: {
        name,
        description: null,
        typeKey,
        section: {
          typeKey,
          rounds: roundsMatch ? Number(roundsMatch[1]) : null,
          durationSeconds: durationSeconds(fullText),
          restSeconds: null,
          repScheme,
          notes: null,
          movements,
        },
      },
      summary: {
        totalLines: lines.length,
        matchedMovements: movements.filter(
          (item) => item.matchStatus === 'MATCHED',
        ).length,
        unresolvedMovements: movements.filter(
          (item) => item.matchStatus !== 'MATCHED',
        ).length,
      },
      issues,
    };
  }
}
