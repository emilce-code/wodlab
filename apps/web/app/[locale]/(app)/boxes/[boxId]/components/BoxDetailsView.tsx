"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { Link } from "@/i18n/navigation";
import { boxImageUrl } from "@/lib/box-images";

type Props = {
  boxId: string;
};

function compactCoordinate(value: number | null) {
  return value === null ? null : value.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
}

export default function BoxDetailsView({ boxId }: Props) {
  const t = useTranslations("boxDetails");
  const boxesT = useTranslations("boxes");
  const { boxes, activeBox, selectBox, saving } = useActiveBox();
  const box = boxes.find((item) => item.id === boxId) ?? null;

  if (!box) {
    return (
      <section className="mt-6 rounded-3xl border border-dashed border-border bg-surface/50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-lg font-black text-muted">
          ?
        </div>
        <h2 className="mt-4 text-lg font-bold">{t("missing.title")}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          {t("missing.description")}
        </p>
        <Link
          href="/classes"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-black text-accent-foreground"
        >
          {t("actions.backToClasses")}
        </Link>
      </section>
    );
  }

  const canManage = box.role === "OWNER" || box.role === "COACH";
  const hasCoordinates = box.latitude !== null && box.longitude !== null;
  const coordinateLabel = hasCoordinates
    ? `${compactCoordinate(box.latitude)}, ${compactCoordinate(box.longitude)}`
    : null;

  return (
    <div className="mt-6 space-y-4 pb-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="relative h-40 bg-gradient-to-br from-surface-elevated to-background">
          {boxImageUrl(box.coverImagePath) ? (
            <Image
              src={boxImageUrl(box.coverImagePath)!}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-cover opacity-70"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,18,0.24),transparent_45%),linear-gradient(135deg,rgba(163,255,18,0.12),rgba(255,255,255,0.03)_38%,rgba(0,0,0,0)_70%)]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        </div>

        <div className="-mt-10 relative px-4 pb-5">
          <div className="flex items-end gap-3">
            {boxImageUrl(box.logoPath) ? (
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border-4 border-surface bg-background shadow-lg">
                <Image
                  src={boxImageUrl(box.logoPath)!}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-4 border-surface bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_35%),linear-gradient(135deg,#a3ff12,#6bd600)] text-3xl font-black text-black shadow-lg">
                {box.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase text-accent">
                {boxesT(`roles.${box.role.toLowerCase()}`)}
              </span>
              <h2 className="mt-2 truncate text-2xl font-black">{box.name}</h2>
            </div>
          </div>

          {box.description ? (
            <p className="mt-4 text-sm leading-6 text-muted">{box.description}</p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <InfoPill label={t("stats.members")} value={boxesT("members", { count: box._count.memberships })} />
            <InfoPill label={t("stats.classes")} value={String(box._count.classes ?? 0)} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-lg font-bold">{t("location.title")}</h2>
        <div className="mt-4 space-y-3">
          <DetailRow label={t("location.area")} value={box.location || t("empty")} />
          <DetailRow label={t("location.address")} value={box.address || t("empty")} />
          <DetailRow label={t("location.timezone")} value={box.timezone.replaceAll("_", " ")} />
          <DetailRow label={t("location.coordinates")} value={coordinateLabel || t("location.noCoordinates")} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="text-lg font-bold">{t("support.title")}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
          {box.supportContact || t("support.empty")}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href="/classes"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-black text-accent-foreground"
        >
          {t("actions.viewClasses")}
        </Link>
        {activeBox?.id !== box.id ? (
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void selectBox(box.id)}
          >
            {saving ? t("actions.switching") : t("actions.makeActive")}
          </Button>
        ) : null}
        {canManage ? (
          <Link
            href="/box-admin"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-surface-elevated px-4 text-sm font-bold text-foreground"
          >
            {t("actions.manage")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}