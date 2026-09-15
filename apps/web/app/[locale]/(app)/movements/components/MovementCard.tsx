"use client";

import { useTranslations } from "next-intl";

import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

export type Movement = {
  id: string;
  name: string;
  aliases: string[];
  isFoundational: boolean;
  official: boolean;
  scope: "GLOBAL" | "BOX" | "PERSONAL";
  box: { id: string; name: string } | null;
  description: string | null;
  videoUrl: string | null;
  canEdit: boolean;
  canDelete: boolean;
  category: { key: string; name: string };
  measurementTypes: { key: string; name: string }[];
};

type Props = { movement: Movement };

export default function MovementCard({ movement }: Props) {
  const t = useTranslations("movements");
  const categoryT = useTranslations("movementCategories");
  const measurementT = useTranslations("measurementTypes");
  const scopeT = useTranslations("movementScopes");

  function getCategoryName() {
    const key = movement.category.key.toLowerCase();
    return categoryT.has(key) ? categoryT(key) : movement.category.name;
  }

  function getMeasurementName(type: { key: string; name: string }) {
    const key = type.key.toLowerCase();
    return measurementT.has(key) ? measurementT(key) : type.name;
  }

  return (
    <Link href={`/movements/${movement.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-4 transition hover:border-accent/40 hover:bg-surface-elevated sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {getCategoryName()}
            </p>
            <span className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
              {scopeT(movement.scope.toLowerCase())}
              {movement.scope === "BOX" && movement.box
                ? ` · ${movement.box.name}`
                : ""}
            </span>
          </div>

          {movement.isFoundational ? (
            <span className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {t("foundational")}
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight">
          {movement.name}
        </h2>

        {movement.scope === "PERSONAL" ? (
          <p className="mt-1 text-xs text-muted">{scopeT("personalHelp")}</p>
        ) : movement.scope === "BOX" ? (
          <p className="mt-1 text-xs text-muted">
            {scopeT("boxHelp", { box: movement.box?.name ?? scopeT("box") })}
          </p>
        ) : null}

        {movement.aliases.length > 0 ? (
          <p className="mt-2 text-sm text-muted">
            {movement.aliases.join(" · ")}
          </p>
        ) : null}

        {movement.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
            {movement.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
          {movement.measurementTypes.map((type) => (
            <span
              key={type.key}
              className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-muted"
            >
              {getMeasurementName(type)}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}
