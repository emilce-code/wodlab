"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { selectWorkoutVariant } from "@/lib/workout-variants";

import WorkoutCopyToBoxAction from "./WorkoutCopyToBoxAction";
import WorkoutLifecycleActions from "./WorkoutLifecycleActions";

export type WorkoutScope = "GLOBAL" | "BOX" | "PERSONAL";

export type Workout = {
  id: string;
  name: string;
  description: string | null;
  scope: WorkoutScope;
  box: {
    id: string;
    name: string;
  } | null;
  sourceWorkout: {
    id: string;
    name: string;
  } | null;
  isBenchmark: boolean;
  official: boolean;
  isActive: boolean;
  deactivatedAt: string | null;
  resultCount: number;
  canManage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCopyToBox: boolean;

  createdByUser: {
    id: string;
    email: string;
  };

  type: {
    key: string;
    name: string;
  };

  variants: {
    id: string;

    level: {
      key: string;
      name: string;
    };

    sections: {
      id: string;
      order: number;
      repScheme: number[];

      movements: {
        id: string;

        movement: {
          id: string;
          name: string;
        };
      }[];
    }[];
  }[];
};

type Props = {
  workout: Workout;
  canManage: boolean;
  preferredWorkoutLevelKey: string | null;
};

const scopeLabels = {
  en: {
    GLOBAL: "Global",
    BOX: "Box",
    PERSONAL: "Personal",
    copied: "Copied from global catalog",
  },
  es: {
    GLOBAL: "Global",
    BOX: "Box",
    PERSONAL: "Personal",
    copied: "Copiado del catálogo global",
  },
  pt: {
    GLOBAL: "Global",
    BOX: "Box",
    PERSONAL: "Pessoal",
    copied: "Copiado do catálogo global",
  },
} as const;

export default function WorkoutCard({
  workout,
  canManage,
  preferredWorkoutLevelKey,
}: Props) {
  const t = useTranslations("workouts.library");
  const typeT = useTranslations("workoutTypes");
  const locale = useLocale();
  const scopeCopy =
    scopeLabels[locale as keyof typeof scopeLabels] ?? scopeLabels.en;

  const defaultVariant = selectWorkoutVariant(workout.variants, {
    preferredLevelKey: preferredWorkoutLevelKey,
  });

  const firstSection = defaultVariant?.sections[0];

  const movementNames = Array.from(
    new Set(
      defaultVariant?.sections.flatMap((section) =>
        section.movements.map((item) => item.movement.name),
      ) ?? [],
    ),
  );

  function getWorkoutTypeName() {
    const key = workout.type.key
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

    return typeT.has(key) ? typeT(key) : workout.type.name;
  }

  function getScopeLabel() {
    if (workout.scope === "BOX" && workout.box?.name) {
      return workout.box.name;
    }

    return scopeCopy[workout.scope];
  }

  return (
    <Card className="group flex h-full flex-col p-4 transition duration-200 hover:border-accent/40 sm:p-6 sm:hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {getWorkoutTypeName()}
            </p>

            {defaultVariant ? <Badge>{defaultVariant.level.name}</Badge> : null}

            <Badge>{getScopeLabel()}</Badge>
          </div>

          {workout.sourceWorkout ? (
            <p className="mt-2 text-xs text-muted">
              {scopeCopy.copied}: {workout.sourceWorkout.name}
            </p>
          ) : null}
        </div>

        {workout.isBenchmark ? <Badge>{t("benchmark")}</Badge> : null}
      </div>

      <Link href={`/workouts/${workout.id}`} className="mt-4 block">
        <h2 className="text-2xl font-black tracking-tight transition-colors group-hover:text-accent">
          {workout.name}
        </h2>
      </Link>

      {firstSection && firstSection.repScheme.length > 0 ? (
        <p className="mt-4 text-xl font-bold tracking-wide">
          {firstSection.repScheme.join(" — ")}
        </p>
      ) : null}

      {workout.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted">
          {workout.description}
        </p>
      ) : null}

      <div className="mt-6 space-y-2">
        {movementNames.slice(0, 4).map((name) => (
          <p key={name} className="text-sm font-medium">
            {name}
          </p>
        ))}

        {movementNames.length > 4 ? (
          <p className="text-xs text-muted">
            {t("moreMovements", {
              count: movementNames.length - 4,
            })}
          </p>
        ) : null}
      </div>

      {workout.variants.length > 1 ? (
        <p className="mt-5 text-xs text-muted">
          {workout.variants.map((variant) => variant.level.name).join(" · ")}
        </p>
      ) : null}

      <div className="mt-auto space-y-3 pt-6 sm:pt-8">
        <Link
          href={`/workouts/${workout.id}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-muted transition-colors group-hover:text-accent"
        >
          {t("viewWorkout")} →
        </Link>

        {workout.canCopyToBox || canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {workout.canCopyToBox ? (
              <WorkoutCopyToBoxAction workoutId={workout.id} />
            ) : null}

            {canManage ? (
              <WorkoutLifecycleActions workout={workout} />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
