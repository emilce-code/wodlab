"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import BoxLogo from "@/components/ui/BoxLogo";
import BoxLocationMap from "@/components/ui/BoxLocationMap";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { Link, useRouter } from "@/i18n/navigation";
import { boxDestination, contactActions } from "@/lib/box-details";
import type { ManagedBox } from "@/lib/boxes";

export default function BoxDetailsView({ box }: { box: ManagedBox }) {
  const t = useTranslations("boxDetailsV4");
  const router = useRouter();
  const { selectBox, saving } = useActiveBox();
  const [sheet, setSheet] = useState<"contact" | "maps" | null>(null);
  const [navigationError, setNavigationError] = useState(false);
  const location = boxDestination(box);
  const { actions, notes } = contactActions(box);
  const showContactOptions = actions.length > 2 || Boolean(notes);
  const rowClass =
    "flex min-h-12 items-center gap-3 rounded-xl border border-border/60 bg-surface px-3 py-3 text-sm text-foreground";
  const interactiveRowClass = `${rowClass} transition-colors duration-200 hover:bg-surface-elevated active:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none`;
  return (
    <div className="space-y-4 pb-4">
      <nav
        aria-label={t("title")}
        className="grid min-h-11 grid-cols-[44px_1fr_44px] items-center border-b border-border pb-2"
      >
        <Link
          href="/classes"
          aria-label={t("back")}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground active:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <BoxDetailsIcon name="back" />
        </Link>
        <p className="text-center text-sm font-semibold">{t("title")}</p>
      </nav>
      <header className="flex flex-col items-center gap-2 text-center">
        <BoxLogo name={box.name} path={box.logoPath} />
        <h1 className="max-w-full break-words text-xl font-bold leading-7 tracking-tight">
          {box.name}
        </h1>
        {box.organization?.name ? (
          <p className="max-w-full break-words text-sm font-medium text-muted">
            {box.organization.name}
          </p>
        ) : null}
        {box.location ? (
          <p className="flex max-w-full items-start justify-center gap-2 text-sm text-muted">
            <BoxDetailsIcon
              name="location"
              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            />
            <span className="min-w-0 break-words">{box.location}</span>
          </p>
        ) : null}
      </header>
      {box.description ? (
        <p className="whitespace-pre-line text-sm leading-5 text-foreground/90">
          {box.description}
        </p>
      ) : null}
      {actions.length || notes ? (
        <section aria-label={t("contactTitle")} className="space-y-3">
          {actions.length ? (
            <div
              className={`grid gap-3 ${actions.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {actions.slice(0, 2).map((action) => (
                <a
                  key={action.channel + action.href}
                  aria-label={t(`channels.${action.channel}`)}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`${interactiveRowClass.replace("border-border/60", "border-accent")} justify-center`}
                >
                  <BoxDetailsIcon
                    name={action.channel}
                    className="h-6 w-6 shrink-0 text-accent"
                  />
                  <span>
                    {action.channel === "phone"
                      ? t("call")
                      : t(`channels.${action.channel}`)}
                  </span>
                </a>
              ))}
            </div>
          ) : null}
          {showContactOptions ? (
            <button
              type="button"
              onClick={() => setSheet("contact")}
              className={`${interactiveRowClass} w-full text-left`}
            >
              <BoxDetailsIcon name="info" className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t("contactOptions")}</span>
              <BoxDetailsIcon
                name="chevron"
                className="h-4 w-4 shrink-0 text-muted"
              />
            </button>
          ) : null}
        </section>
      ) : null}
      {location.destination ? (
        <section
          aria-label={t("locationTitle")}
          className="space-y-2 border-t border-border pt-3"
        >
          <h2 className="text-sm font-semibold">{t("locationTitle")}</h2>
          {location.coordinates ? (
            <BoxLocationMap
              name={box.name}
              destination={location.destination!}
            />
          ) : null}
          {box.address || box.location ? (
            <p className="flex items-start gap-2 whitespace-pre-line break-words text-sm leading-5">
              <BoxDetailsIcon
                name="location"
                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
              />
              {box.address || box.location}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full rounded-xl duration-200 active:bg-accent-strong motion-reduce:transition-none"
            onClick={() => setSheet("maps")}
          >
            <BoxDetailsIcon name="directions" />
            {t("directions")}
          </Button>
        </section>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        disabled={saving}
        className="w-full justify-start gap-3 rounded-xl border-border/60 duration-200 active:bg-surface-elevated motion-reduce:transition-none"
        onClick={async () => {
          if (await selectBox(box.id)) router.push("/classes");
          else setNavigationError(true);
        }}
      >
        <BoxDetailsIcon name="classes" className="h-6 w-6 text-accent" />
        <span className="flex-1 text-left">
          {saving ? t("working") : t("classes")}
        </span>
        <BoxDetailsIcon name="chevron" className="h-4 w-4 text-muted" />
      </Button>
      {navigationError ? (
        <p role="alert" className="text-sm text-red-300">
          {t("navigationError")}
        </p>
      ) : null}
      {box.canEditDetails ? (
        <Link
          href={`/boxes/${box.id}/edit`}
          className={`${interactiveRowClass} justify-center text-accent`}
        >
          {t("edit")}
        </Link>
      ) : null}
      {sheet === "contact" ? (
        <BottomSheet
          title={t("contactSheetTitle", { name: box.name })}
          onClose={() => setSheet(null)}
        >
          <div className="space-y-2">
            {actions.map((action) => (
              <a
                key={action.channel + action.href}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={interactiveRowClass}
              >
                <BoxDetailsIcon
                  name={action.channel}
                  className="h-7 w-7 shrink-0 text-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">
                    {t(`channels.${action.channel}`)}
                  </span>
                  <span className="mt-1 block break-words text-xs text-muted">
                    {action.value}
                  </span>
                </span>
                <BoxDetailsIcon
                  name="chevron"
                  className="h-4 w-4 shrink-0 text-muted"
                />
              </a>
            ))}
            {notes ? (
              <p className="whitespace-pre-line break-words py-3 text-sm">
                {notes}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full rounded-xl border-border/60 duration-200 active:bg-surface-elevated motion-reduce:transition-none"
            onClick={() => setSheet(null)}
          >
            {t("dismissMaps")}
          </Button>
        </BottomSheet>
      ) : null}
      {sheet === "maps" ? (
        <BottomSheet title={t("directions")} onClose={() => setSheet(null)}>
          {location.coordinates ? (
            <div className="mb-3">
              <BoxLocationMap
                name={box.name}
                destination={location.destination!}
              />
            </div>
          ) : null}
          <p className={`${rowClass} mb-3`}>
            <BoxDetailsIcon
              name="location"
              className="h-6 w-6 shrink-0 text-accent"
            />
            <span className="min-w-0 break-words text-sm">
              {box.address || box.location || box.name}
            </span>
          </p>
          <div className="space-y-3">
            {location.google ? (
              <a
                href={location.google}
                target="_blank"
                rel="noopener noreferrer"
                className={interactiveRowClass}
              >
                <BoxDetailsIcon
                  name="location"
                  className="h-7 w-7 shrink-0 text-accent"
                />
                <span className="flex-1">
                  <span className="block font-medium">Google Maps</span>
                  <span className="mt-1 block text-xs text-muted">
                    {t("openGoogle")}
                  </span>
                </span>
                <BoxDetailsIcon
                  name="external"
                  className="h-4 w-4 shrink-0 text-muted"
                />
              </a>
            ) : null}
            {location.apple ? (
              <a
                href={location.apple}
                target="_blank"
                rel="noopener noreferrer"
                className={interactiveRowClass}
              >
                <BoxDetailsIcon
                  name="directions"
                  className="h-7 w-7 shrink-0 text-accent"
                />
                <span className="flex-1">
                  <span className="block font-medium">Apple Maps</span>
                  <span className="mt-1 block text-xs text-muted">
                    {t("openApple")}
                  </span>
                </span>
                <BoxDetailsIcon
                  name="external"
                  className="h-4 w-4 shrink-0 text-muted"
                />
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full rounded-xl border-border/60 duration-200 active:bg-surface-elevated motion-reduce:transition-none"
            onClick={() => setSheet(null)}
          >
            {t("dismissMaps")}
          </Button>
        </BottomSheet>
      ) : null}
    </div>
  );
}
