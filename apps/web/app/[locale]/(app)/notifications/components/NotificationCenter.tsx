"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type {
  NotificationItem,
  NotificationPreferences,
  NotificationResponse,
} from "@/lib/notifications";

type Props = { initialData: NotificationResponse | null };

export default function NotificationCenter({ initialData }: Props) {
  const t = useTranslations("notifications");
  const [data, setData] = useState<NotificationResponse | null>(initialData);
  const [error, setError] = useState(!initialData);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setData((await response.json()) as NotificationResponse);
      setError(false);
    } catch {
      setError(true);
    }
  }

  async function mutate(
    path: string,
    method: "PATCH" | "DELETE",
    body?: object,
  ) {
    setSaving(true);
    try {
      const response = await fetch(`/api/notifications/${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error();
      await load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function message(item: NotificationItem) {
    if (item.type === "COACH_INVITATION")
      return t("coachInvitation", { coach: item.data.coachName });
    if (item.type === "OVERDUE_WORKOUT")
      return t("overdueWorkout", { workout: item.data.workoutName });
    return t("upcomingWorkout", { workout: item.data.workoutName });
  }

  function updatePreference(change: Partial<NotificationPreferences>) {
    return mutate("preferences", "PATCH", change);
  }

  if (!data && !error)
    return (
      <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>
    );

  return (
    <div className="space-y-4 pb-6">
      {error ? <Alert variant="error">{t("error")}</Alert> : null}

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">{t("inbox")}</h2>
            <p className="text-sm text-muted">
              {t("unread", { count: data?.unreadCount ?? 0 })}
            </p>
          </div>
          {(data?.unreadCount ?? 0) > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void mutate("read-all", "PATCH")}
            >
              {t("readAll")}
            </Button>
          ) : null}
        </div>
      </Card>

      {data?.notifications.length ? (
        <div className="space-y-3">
          {data.notifications.map((item) => (
            <Card
              key={item.key}
              className={`p-4 ${item.read ? "opacity-75" : "border-accent/40"}`}
            >
              <div className="flex gap-3">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-border" : "bg-accent"}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{message(item)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(item.occurredAt))}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={item.href}
                      onClick={() =>
                        void mutate(
                          `${encodeURIComponent(item.key)}/read`,
                          "PATCH",
                        )
                      }
                      className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-bold text-background"
                    >
                      {t("open")}
                    </Link>
                    {!item.read ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={saving}
                        onClick={() =>
                          void mutate(
                            `${encodeURIComponent(item.key)}/read`,
                            "PATCH",
                          )
                        }
                      >
                        {t("markRead")}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saving}
                      onClick={() =>
                        void mutate(encodeURIComponent(item.key), "DELETE")
                      }
                    >
                      {t("dismiss")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-sm text-muted">{t("empty")}</Card>
      )}

      {data ? (
        <Card className="p-4 sm:p-5">
          <h2 className="font-bold">{t("preferences")}</h2>
          <div className="mt-4 space-y-4">
            <label className="flex min-h-11 items-center justify-between gap-4">
              <span>{t("workoutReminders")}</span>
              <input
                type="checkbox"
                checked={data.preferences.workoutReminders}
                disabled={saving}
                onChange={(event) =>
                  void updatePreference({
                    workoutReminders: event.target.checked,
                  })
                }
                className="h-5 w-5 accent-accent"
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-4">
              <span>{t("coachUpdates")}</span>
              <input
                type="checkbox"
                checked={data.preferences.coachUpdates}
                disabled={saving}
                onChange={(event) =>
                  void updatePreference({ coachUpdates: event.target.checked })
                }
                className="h-5 w-5 accent-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">{t("leadDays")}</span>
              <select
                value={data.preferences.reminderLeadDays}
                disabled={saving || !data.preferences.workoutReminders}
                onChange={(event) =>
                  void updatePreference({
                    reminderLeadDays: Number(event.target.value),
                  })
                }
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
              >
                <option value="0">{t("sameDay")}</option>
                <option value="1">{t("oneDay")}</option>
                <option value="2">{t("days", { count: 2 })}</option>
                <option value="3">{t("days", { count: 3 })}</option>
                <option value="7">{t("days", { count: 7 })}</option>
              </select>
            </label>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
