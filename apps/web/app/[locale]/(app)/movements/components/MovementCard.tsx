'use client';

import { useTranslations } from 'next-intl';

import Card from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

export type Movement = {
  id: string;
  name: string;
  aliases: string[];
  isFoundational: boolean;
  official: boolean;

  category: {
    key: string;
    name: string;
  };

  measurementTypes: {
    key: string;
    name: string;
  }[];
};

type Props = {
  movement: Movement;
};

export default function MovementCard({
  movement,
}: Props) {
  const t =
    useTranslations(
      'movements',
    );

  const categoryT =
    useTranslations(
      'movementCategories',
    );

  const measurementT =
    useTranslations(
      'measurementTypes',
    );

  function getCategoryName() {
    const key =
      movement.category.key.toLowerCase();

    return categoryT.has(key)
      ? categoryT(key)
      : movement.category.name;
  }

  function getMeasurementName(
    type: {
      key: string;
      name: string;
    },
  ) {
    const key =
      type.key.toLowerCase();

    return measurementT.has(
      key,
    )
      ? measurementT(key)
      : type.name;
  }

  return (
    <Link
      href={`/movements/${movement.id}`}
      className="block h-full"
    >
      <Card className="flex h-full flex-col p-5 transition hover:border-accent/40 hover:bg-surface-elevated">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {getCategoryName()}
          </p>

          {movement.isFoundational && (
            <span className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {t(
                'foundational',
              )}
            </span>
          )}
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight">
          {movement.name}
        </h2>

        {movement.aliases.length >
          0 && (
          <p className="mt-2 text-sm text-muted">
            {movement.aliases.join(
              ' · ',
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {movement.measurementTypes.map(
            (type) => (
              <span
                key={type.key}
                className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-muted"
              >
                {getMeasurementName(
                  type,
                )}
              </span>
            ),
          )}
        </div>
      </Card>
    </Link>
  );
}