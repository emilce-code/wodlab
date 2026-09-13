import { getTranslations } from "next-intl/server";
import Image from "next/image";

import Wordmark from "@/components/brand/Wordmark";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

const featureKeys = ["plan", "log", "progress", "coach"] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8 lg:px-10">
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:flex">
            <Link
              href="/"
              aria-label="WODLY"
              className="flex min-h-11 items-center gap-2"
            >
              <Image
                src="/icon-192.png"
                alt=""
                width={36}
                height={36}
                priority
                className="h-9 w-9 rounded-lg"
              />
              <Wordmark />
            </Link>

            <div className="flex items-center justify-end gap-2 sm:order-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface hover:text-foreground"
              >
                {t("signIn")}
              </Link>

              <Link
                href="/register"
                className="hidden min-h-11 items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-strong sm:inline-flex"
              >
                {t("getStarted")}
              </Link>
            </div>

            <div className="col-span-2 w-full sm:order-2 sm:ml-auto sm:w-36">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-12 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t("hero.eyebrow")}
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title")}{" "}
              <span className="text-accent">{t("hero.titleAccent")}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {t("hero.description")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent-strong sm:w-auto"
              >
                {t("hero.primaryAction")} →
              </Link>

              <Link
                href="#features"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold transition hover:bg-surface-elevated sm:w-auto"
              >
                {t("hero.secondaryAction")}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <TrustPill label={t("hero.pills.athletes")} />
              <TrustPill label={t("hero.pills.coaches")} />
            </div>
          </div>

          <WorkoutPreview
            label={t("preview.today")}
            workoutType={t("preview.forTime")}
            level={t("preview.level")}
            personalBest={t("preview.personalBest")}
            planned={t("preview.planned")}
          />
        </div>
      </section>

      <section id="features" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {t("features.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {t("features.title")}
            </h2>
            <p className="mt-4 leading-7 text-muted">
              {t("features.description")}
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featureKeys.map((key, index) => (
              <FeatureCard
                key={key}
                number={String(index + 1).padStart(2, "0")}
                title={t(`features.items.${key}.title`)}
                description={t(`features.items.${key}.description`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {t("connected.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {t("connected.title")}
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted sm:text-lg sm:leading-8">
              {t("connected.description")}
            </p>
          </div>

          <Card className="p-5 sm:p-7">
            <div className="space-y-3">
              <Benefit text={t("connected.benefits.programming")} />
              <Benefit text={t("connected.benefits.feedback")} />
              <Benefit text={t("connected.benefits.load")} />
              <Benefit text={t("connected.benefits.community")} />
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-8 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {t("cta.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">
            {t("cta.description")}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent-strong sm:w-auto"
          >
            {t("cta.action")} →
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Wordmark className="text-sm" />
          <p>{t("footer")}</p>
        </div>
      </footer>
    </main>
  );
}

function TrustPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
      {label}
    </span>
  );
}

function WorkoutPreview({
  label,
  workoutType,
  level,
  personalBest,
  planned,
}: {
  label: string;
  workoutType: string;
  level: string;
  personalBest: string;
  planned: string;
}) {
  return (
    <Card className="overflow-hidden shadow-2xl shadow-black/10">
      <div className="border-b border-border bg-surface-elevated px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {label}
          </p>
          <Badge>{planned}</Badge>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{workoutType}</Badge>
          <Badge>{level}</Badge>
        </div>
        <h2 className="mt-4 text-4xl font-black tracking-tight">Fran</h2>
        <p className="mt-3 text-2xl font-black tracking-wide">21 — 15 — 9</p>

        <div className="mt-7 space-y-3">
          <WorkoutLine name="Thruster" value="43 kg" />
          <WorkoutLine name="Pull-up" />
        </div>

        <div className="mt-7 rounded-xl border border-accent/25 bg-accent/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
            {personalBest}
          </p>
          <p className="mt-2 text-3xl font-black">5:58</p>
        </div>
      </div>
    </Card>
  );
}

function WorkoutLine({ name, value }: { name: string; value?: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="font-semibold">{name}</span>
      {value ? <span className="text-sm text-muted">{value}</span> : null}
    </div>
  );
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full p-5">
      <p className="text-xs font-black text-accent">{number}</p>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </Card>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-accent-foreground"
      >
        ✓
      </span>
      <span className="text-sm font-semibold sm:text-base">{text}</span>
    </div>
  );
}
