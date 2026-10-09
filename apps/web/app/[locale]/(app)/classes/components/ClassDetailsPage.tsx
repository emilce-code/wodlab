"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { classApiPath } from "@/lib/class-schedule";
import type { ClassSession, ManagedBox } from "@/lib/boxes";
import ClassDetails from "./ClassDetails";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
export default function ClassDetailsPage({
  boxId,
  classId,
  day,
  view,
}: {
  boxId: string;
  classId: string;
  day?: string;
  view?: string;
}) {
  const t = useTranslations("classesV7");
  const [session, setSession] = useState<ClassSession | null>(null);
  const [box, setBox] = useState<ManagedBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [classResponse, boxResponse] = await Promise.all([
          fetch(classApiPath(boxId, classId), { signal, cache: "no-store" }),
          fetch(`/api/boxes/${encodeURIComponent(boxId)}`, {
            signal,
            cache: "no-store",
          }),
        ]);
        if (!classResponse.ok || !boxResponse.ok) throw Error();
        const [nextSession, nextBox] = await Promise.all([
          classResponse.json() as Promise<ClassSession>,
          boxResponse.json() as Promise<ManagedBox>,
        ]);
        if (signal?.aborted) return;
        setSession(nextSession);
        setBox(nextBox);
        setError(false);
      } catch (caught) {
        if (!signal?.aborted) {
          setError(true);
          throw caught;
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [boxId, classId],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => load(controller.signal))
      .catch(() => undefined);
    return () => controller.abort();
  }, [load]);
  const query = new URLSearchParams();
  if (day) query.set("day", day);
  if (view === "mine") query.set("view", view);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-2">
        <Link
          aria-label={t("back")}
          href={`/classes${query.size ? `?${query}` : ""}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted focus-visible:outline-accent"
        >
          <BoxDetailsIcon name="back" />
        </Link>
        <p className="text-sm font-semibold">{t("details")}</p>
      </header>
      {loading ? <p role="status">{t("loading")}</p> : null}
      {error ? (
        <div role="alert">
          <p className="text-sm text-red-400">{t("loadError")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoading(true);
              void load().catch(() => undefined);
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {session && box ? (
        <ClassDetails
          key={session.id}
          session={session}
          box={box}
          onChange={setSession}
          refresh={() =>
            load().catch(() => {
              setError(false);
              throw Error();
            })
          }
          page
          canBook={session.role === "ATHLETE"}
        />
      ) : null}
    </div>
  );
}
