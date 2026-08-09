import { redirect } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const displayName =
    user.athleteProfile?.displayName ?? user.email;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Today
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Good evening, {displayName}.
        </h1>

        <p className="mt-2 text-muted">
          Ready to train?
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            Today&apos;s workout
          </h2>
        </div>

        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  For Time
                </p>

                <Badge>
                  Benchmark
                </Badge>
              </div>

              <h3 className="mt-3 text-4xl font-black tracking-tight">
                Fran
              </h3>

              <p className="mt-5 text-2xl font-bold tracking-wide">
                21 — 15 — 9
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    Thruster
                  </span>

                  <span className="text-muted">
                    43 kg
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    Pull-up
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Button className="w-full sm:w-auto">
                  Start Workout →
                </Button>
              </div>
            </div>

            <div className="hidden border-l border-border bg-surface-elevated/50 lg:block" />
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            Recent activity
          </h2>

          <button
            type="button"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            View all history →
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <Card>
            <div className="divide-y divide-border">
              <ActivityRow
                name="Helen"
                meta="For Time"
                result="11:24"
                badge="Rx"
              />

              <ActivityRow
                name="Back Squat"
                meta="5 × 5"
                result="100 kg"
              />

              <ActivityRow
                name="Cindy"
                meta="AMRAP 20"
                result="17 + 8 reps"
                badge="Rx"
              />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              This month
            </p>

            <div className="mt-5 space-y-5">
              <Stat
                label="Workouts"
                value="12"
              />

              <Stat
                label="PRs"
                value="4"
                accent
              />

              <Stat
                label="Volume"
                value="2,450"
                suffix="reps"
              />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

type ActivityRowProps = {
  name: string;
  meta: string;
  result: string;
  badge?: string;
};

function ActivityRow({
  name,
  meta,
  result,
  badge,
}: ActivityRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-sm font-bold text-accent">
        +
      </div>

      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
        <p className="font-medium">
          {name}
        </p>

        <p className="text-sm text-muted">
          {meta}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {result}
        </span>

        {badge && (
          <Badge variant="accent">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
};

function Stat({
  label,
  value,
  suffix,
  accent = false,
}: StatProps) {
  return (
    <div>
      <p className="text-xs text-muted">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={[
            'text-2xl font-bold',
            accent ? 'text-accent' : '',
          ].join(' ')}
        >
          {value}
        </span>

        {suffix && (
          <span className="text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}