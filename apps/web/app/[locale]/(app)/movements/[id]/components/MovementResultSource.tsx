import Badge from '@/components/ui/Badge';
import {
  Link,
} from '@/i18n/navigation';

type Source =
  | {
      type: 'MANUAL';
    }
  | {
      type: 'WORKOUT';

      workoutResultId: string;

      workout: {
        id: string;
        name: string;
      };

      workoutVariant: {
        id: string;
        name: string | null;

        level: {
          key: string;
          name: string;
        };
      };

      prescriptionCategory: {
        key: string;
        name: string;
      } | null;
    };

type Props = {
  source: Source;
  locale: string;
  compact?: boolean;
};

const labels = {
  en: {
    manual:
      'Logged manually',
    fromWorkout:
      'From workout',
  },

  es: {
    manual:
      'Registrado manualmente',
    fromWorkout:
      'Desde entrenamiento',
  },

  pt: {
    manual:
      'Registrado manualmente',
    fromWorkout:
      'Do treino',
  },
} as const;

function getLabels(
  locale: string,
) {
  if (
    locale.startsWith(
      'es',
    )
  ) {
    return labels.es;
  }

  if (
    locale.startsWith(
      'pt',
    )
  ) {
    return labels.pt;
  }

  return labels.en;
}

export default function MovementResultSource({
  source,
  locale,
  compact = false,
}: Props) {
  const text =
    getLabels(locale);

  if (
    source.type ===
    'MANUAL'
  ) {
    return (
      <p className="text-sm text-muted">
        {text.manual}
      </p>
    );
  }

  return (
    <div
      className={
        compact
          ? 'space-y-1.5'
          : 'space-y-2'
      }
    >
      <p className="text-sm text-muted">
        {text.fromWorkout}
        {' · '}

        <Link
          href={`/workouts/${source.workout.id}`}
          className="font-medium text-foreground transition hover:text-accent"
        >
          {
            source.workout
              .name
          }
        </Link>
      </p>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={
            source
              .workoutVariant
              .level.key ===
            'RX'
              ? 'accent'
              : undefined
          }
        >
          {
            source
              .workoutVariant
              .level.name
          }
        </Badge>

        {source
          .prescriptionCategory && (
          <Badge>
            {
              source
                .prescriptionCategory
                .name
            }
          </Badge>
        )}
      </div>
    </div>
  );
}