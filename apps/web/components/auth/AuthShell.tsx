import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function AuthShell({ children }: Props) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          {/* Decorative lime glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl"
          />

          {/* Logo */}
          <div className="relative z-10">
            <span className="text-xl font-black tracking-tight">
              WOD<span className="text-accent">LAB</span>
            </span>
          </div>

          {/* Main message */}
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Train · Log · Track
            </p>

            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              Every workout
              <br />
              tells a story.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-muted">
              Build consistency, track your progress and
              see what your training is really doing.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-accent" />
              <div className="h-1 w-3 rounded-full bg-accent/40" />
              <div className="h-1 w-3 rounded-full bg-accent/20" />
            </div>
          </div>

          <p className="relative z-10 text-xs text-muted">
            WODLab
          </p>
        </section>

        {/* Authentication panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 lg:hidden">
              <span className="text-xl font-black tracking-tight">
                WOD<span className="text-accent">LAB</span>
              </span>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}