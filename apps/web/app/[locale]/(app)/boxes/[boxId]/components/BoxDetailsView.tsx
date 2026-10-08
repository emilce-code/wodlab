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

function mapQuery({
  address,
  latitude,
  longitude,
  name,
}: {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
}) {
  if (latitude !== null && longitude !== null) return `${latitude},${longitude}`;
  return address?.trim() || name;
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
  const directionsQuery = encodeURIComponent(
    mapQuery({
      address: box.address || box.location,
      latitude: box.latitude,
      longitude: box.longitude,
      name: box.name,
    }),
  );

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t("location.title")}</h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              {hasCoordinates ? t("location.mapReady") : t("location.mapNeedsCoordinates")}
            </p>
          </div>
        </div>
        <MapPreview
          title={box.name}
          address={box.address || box.location || t("empty")}
          coordinateLabel={coordinateLabel}
          hasCoordinates={hasCoordinates}
          t={t}
        />
        <div className="mt-4 space-y-3">
          <DetailRow label={t("location.area")} value={box.location || t("empty")} />
          <DetailRow label={t("location.address")} value={box.address || t("empty")} />
          <DetailRow label={t("location.timezone")} value={box.timezone.replaceAll("_", " ")} />
          <DetailRow label={t("location.coordinates")} value={coordinateLabel || t("location.noCoordinates")} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${directionsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-black text-accent-foreground"
          >
            {t("location.openGoogleMaps")}
          </a>
          <a
            href={`https://maps.apple.com/?q=${directionsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-surface-elevated px-4 text-sm font-bold text-foreground"
          >
            {t("location.openAppleMaps")}
          </a>
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

function MapPreview({
  title,
  address,
  coordinateLabel,
  hasCoordinates,
  t,
}: {
  title: string;
  address: string;
  coordinateLabel: string | null;
  hasCoordinates: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-background">
      <div className="relative h-44 bg-[radial-gradient(circle_at_28%_30%,rgba(163,255,18,0.18),transparent_22%),radial-gradient(circle_at_70%_72%,rgba(163,255,18,0.12),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
        <div className="absolute left-8 top-9 h-24 w-[150%] -rotate-12 rounded-full border-y border-accent/25 bg-accent/5" />
        <div className="absolute -left-10 bottom-8 h-20 w-[130%] rotate-12 rounded-full border-y border-white/10 bg-white/5" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-accent text-2xl font-black text-black shadow-2xl">
            {hasCoordinates ? "⌖" : "?"}
          </div>
          <div className="mt-2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {hasCoordinates ? t("location.pinReady") : t("location.pinApproximate")}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-3">
        <p className="truncate text-sm font-black">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{address}</p>
        {coordinateLabel ? (
          <p className="mt-2 font-mono text-[11px] text-accent">{coordinateLabel}</p>
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