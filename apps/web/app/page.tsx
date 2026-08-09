import Link from 'next/link';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            WOD<span className="text-accent">LAB</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-accent/5 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-32">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Train · Log · Track
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Your training.
              <br />
              Your progress.
              <br />
              <span className="text-accent">
                All in one place.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
              Build workouts, log results, track personal
              records and see how your training evolves over
              time.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
              >
                Start training →
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div>
            <Card className="overflow-hidden shadow-2xl shadow-black/10">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    For Time
                  </p>

                  <Badge>
                    Benchmark
                  </Badge>
                </div>

                <h2 className="mt-4 text-4xl font-black tracking-tight">
                  Fran
                </h2>

                <p className="mt-5 text-3xl font-black tracking-wide">
                  21 — 15 — 9
                </p>

                <div className="mt-8 space-y-4">
                  <WorkoutLine
                    name="Thruster"
                    value="43 kg"
                  />

                  <WorkoutLine
                    name="Pull-up"
                  />
                </div>

                <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Personal best
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    5:58
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Rx
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-3">
            <Feature
              number="01"
              title="Build workouts"
              description="Create For Time, AMRAP, strength, interval and custom workouts with real movement data."
            />

            <Feature
              number="02"
              title="Log performance"
              description="Capture time, rounds, reps, loads and notes without losing the structure of the workout."
            />

            <Feature
              number="03"
              title="Track progress"
              description="Follow your history, personal records and performance over time."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Built for training
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Less spreadsheet.
              <br />
              More training.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              WODLab keeps workout structure, movement data,
              results and progress connected so you can spend
              less time organizing and more time training.
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="space-y-5">
              <StatRow
                label="Workouts this month"
                value="12"
              />
              <StatRow
                label="Personal records"
                value="4"
                accent
              />
              <StatRow
                label="Training streak"
                value="8 days"
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Ready?
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Start tracking the work you&apos;re already doing.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-muted">
            Create your account and start building your
            training history.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong"
          >
            Create your WODLab account →
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>
            WOD<span className="text-accent">LAB</span>
          </p>

          <p>
            Train. Log. Track.
          </p>
        </div>
      </footer>
    </main>
  );
}

function WorkoutLine({
  name,
  value,
}: {
  name: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <span className="font-semibold">
        {name}
      </span>

      {value && (
        <span className="text-sm text-muted">
          {value}
        </span>
      )}
    </div>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-black text-accent">
        {number}
      </p>

      <h3 className="mt-3 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-muted">
        {description}
      </p>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <span className="text-muted">
        {label}
      </span>

      <span
        className={[
          'text-2xl font-black',
          accent ? 'text-accent' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}