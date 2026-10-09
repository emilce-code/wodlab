"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import BoxLogo from "@/components/ui/BoxLogo";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { Link, useRouter } from "@/i18n/navigation";
import { boxDestination, contactActions } from "@/lib/box-details";
import type { ManagedBox } from "@/lib/boxes";

export default function BoxDetailsView({ box }: { box: ManagedBox }) {
  const t = useTranslations("boxDetailsV4");
  const router = useRouter();
  const { selectBox, saving } = useActiveBox();
  const [sheet, setSheet] = useState<"contact" | "maps" | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [navigationError, setNavigationError] = useState(false);
  const location = boxDestination(box);
  const { actions, notes } = contactActions(box);
  const actionClass =
    "flex min-h-12 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-bold text-accent";
  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center gap-4">
        <BoxLogo name={box.name} path={box.logoPath} />
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-black">{box.name}</h1>
          {box.organization?.name ? (
            <p className="mt-1 text-sm text-muted">{box.organization.name}</p>
          ) : null}
          {box.location ? (
            <p className="mt-1 text-sm text-muted">{box.location}</p>
          ) : null}
        </div>
      </header>
      {box.description ? (
        <p className="whitespace-pre-line text-sm leading-6 text-muted">
          {box.description}
        </p>
      ) : null}
      {actions.length || notes ? (
        <section aria-label={t("contactTitle")} className="space-y-3">
          {actions.length ? (
            <div className="grid grid-cols-2 gap-3">
              {actions.slice(0, 2).map((action) => (
                <a
                  key={action.channel + action.href}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={actionClass}
                >
                  {t(`channels.${action.channel}`)}
                </a>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSheet("contact")}
            className="min-h-11 w-full text-left text-sm font-semibold text-accent"
          >
            {t("contactOptions")} →
          </button>
        </section>
      ) : null}
      {location.destination ? (
        <section aria-label={t("locationTitle")} className="space-y-3">
          {location.coordinates ? (
            <div className="overflow-hidden rounded-xl border border-border">
              {mapFailed ? (
                <p role="status" className="p-4 text-sm text-muted">
                  {t("mapUnavailable")}
                </p>
              ) : (
                <iframe
                  title={t("mapTitle", { name: box.name })}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(location.destination)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-40 w-full border-0"
                  onError={() => setMapFailed(true)}
                />
              )}
            </div>
          ) : null}
          {box.address || box.location ? (
            <p className="whitespace-pre-line break-words text-sm leading-6">
              {box.address || box.location}
            </p>
          ) : null}
          <button
            type="button"
            className={actionClass + " w-full"}
            onClick={() => setSheet("maps")}
          >
            {t("directions")}
          </button>
        </section>
      ) : null}
      <Button
        type="button"
        disabled={saving}
        className="w-full"
        onClick={async () => {
          if (await selectBox(box.id)) router.push("/classes");
          else setNavigationError(true);
        }}
      >
        {saving ? t("working") : t("classes")}
      </Button>
      {navigationError ? (
        <p role="alert" className="text-sm text-red-300">
          {t("navigationError")}
        </p>
      ) : null}
      {box.canEditDetails ? (
        <Link href={`/boxes/${box.id}/edit`} className={actionClass}>
          {t("edit")}
        </Link>
      ) : null}
      {sheet === "contact" ? (
        <BottomSheet title={t("contactOptions")} onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {actions.map((action) => (
              <a
                key={action.channel + action.href}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="block min-h-12 rounded-xl border border-border p-3"
              >
                <span className="font-bold text-accent">
                  {t(`channels.${action.channel}`)}
                </span>
                <span className="mt-1 block break-words text-sm text-muted">
                  {action.value}
                </span>
              </a>
            ))}
            {notes ? (
              <p className="whitespace-pre-line break-words py-3 text-sm">
                {notes}
              </p>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
      {sheet === "maps" ? (
        <BottomSheet title={t("directions")} onClose={() => setSheet(null)}>
          <p className="mb-4 text-sm text-muted">
            {box.address || box.location || box.name}
          </p>
          <div className="space-y-3">
            {location.google ? (
              <a
                href={location.google}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                Google Maps
              </a>
            ) : null}
            {location.apple ? (
              <a
                href={location.apple}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                Apple Maps
              </a>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
