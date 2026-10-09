"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import type { ClassSession, ManagedBox } from "@/lib/boxes";
import { classApiPath, scheduleTimeZone } from "@/lib/class-schedule";
import { formatTime, formatWeekdayDate } from "@/lib/date-formatters";
import ClassDetails from "./ClassDetails";
import ClassEditor from "./ClassEditor";
import ClassAttendance from "./ClassAttendance";

export default function StaffClassPage({
  boxId,
  classId,
  mode,
  day,
}: {
  boxId: string;
  classId: string;
  mode: "edit" | "attendance";
  day?: string;
}) {
  const t = useTranslations("classStaff");
  const locale = useLocale();
  const router = useRouter();
  const [session, setSession] = useState<ClassSession | null>(null);
  const [box, setBox] = useState<ManagedBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(classApiPath(boxId, classId), {
          signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw Error(response.status === 403 ? "forbidden" : "loadError");
        const next: ClassSession = await response.json();
        if (next.role !== "OWNER" && next.role !== "COACH")
          throw Error("forbidden");
        const boxResponse = await fetch(
          `/api/boxes/${encodeURIComponent(boxId)}`,
          { signal },
        );
        if (!boxResponse.ok) throw Error("loadError");
        const nextBox: ManagedBox = await boxResponse.json();
        if (!signal?.aborted) {
          setSession(next);
          setBox(nextBox);
          setError("");
        }
      } catch (caught) {
        if (!signal?.aborted) {
          setSession(null);
          setError(
            caught instanceof Error && caught.message === "forbidden"
              ? t("forbidden")
              : t("loadError"),
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [boxId, classId, t],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);
  const back = `/classes/${encodeURIComponent(boxId)}/${encodeURIComponent(classId)}${day ? `?${new URLSearchParams({ day })}` : ""}`;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href={back}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted focus-visible:outline-2 focus-visible:outline-accent"
      >
        ← {t("backDetails")}
      </Link>
      {loading ? (
        <p role="status" className="py-6 text-sm text-muted">
          {t("loading")}
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : session && box ? (
        <>
          <header className="space-y-1">
            <p className="text-sm font-semibold text-muted">
              {t(mode === "edit" ? "edit" : "attendance")}
            </p>
            <h1 className="break-words text-xl font-extrabold">
              {session.name}
            </h1>
            <p className="text-sm text-muted">{box.name}</p>
            <p className="text-sm text-muted">
              {formatWeekdayDate(session.startsAt, locale, false, {
                timeZone: scheduleTimeZone(box.timezone),
              })}{" "}
              ·{" "}
              {formatTime(session.startsAt, locale, {
                timeZone: scheduleTimeZone(box.timezone),
              })}{" "}
              · {t("duration", { count: session.durationMinutes })}
            </p>
          </header>
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <div className="hidden min-w-0 border-r border-border pr-6 lg:block">
              <ClassDetails
                session={session}
                box={box}
                onChange={setSession}
                refresh={async () => {
                  await load();
                }}
                canBook={false}
                page
              />
            </div>
            <div className="min-w-0">
              {mode === "edit" ? (
                <ClassEditor
                  session={session}
                  boxId={boxId}
                  page
                  onChange={setSession}
                  onDelete={() =>
                    router.replace(
                      `/classes${day ? `?${new URLSearchParams({ day })}` : ""}`,
                    )
                  }
                />
              ) : (
                <ClassAttendance
                  session={session}
                  boxId={boxId}
                  onChange={setSession}
                />
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
