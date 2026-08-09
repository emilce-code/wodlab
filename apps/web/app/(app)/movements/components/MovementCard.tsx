import Card from '@/components/ui/Card';

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
  return (
    <Card className="flex h-full flex-col p-5 transition hover:border-accent/40">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {movement.category.name}
        </p>

        {movement.isFoundational && (
          <span className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Foundational
          </span>
        )}
      </div>

      <h2 className="mt-4 text-xl font-bold tracking-tight">
        {movement.name}
      </h2>

      {movement.aliases.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {movement.aliases.join(' · ')}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {movement.measurementTypes.map((type) => (
          <span
            key={type.key}
            className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-muted"
          >
            {type.name}
          </span>
        ))}
      </div>
    </Card>
  );
}