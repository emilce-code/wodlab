"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";

import type { Workout } from "./WorkoutCard";

type Props = {
  workout: Workout;
  redirectAfterDelete?: boolean;
};

type LifecycleAction = "delete" | "deactivate" | "reactivate";

export default function WorkoutLifecycleActions({
  workout,
  redirectAfterDelete = false,
}: Props) {
  const t = useTranslations("workouts.lifecycle");
  const router = useRouter();
  const [confirmingAction, setConfirmingAction] =
    useState<LifecycleAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action: LifecycleAction = !workout.isActive
    ? "reactivate"
    : workout.resultCount > 0
      ? "deactivate"
      : "delete";

  async function handleAction() {
    setError(null);
    setIsSubmitting(true);

    const endpoint =
      action === "delete"
        ? `/api/workouts/${workout.id}`
        : `/api/workouts/${workout.id}/${action}`;

    try {
      const response = await fetch(endpoint, {
        method: action === "delete" ? "DELETE" : "PATCH",
      });
      const data = (await response.json()) as { message?: string | string[] };

      if (!response.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : (data.message ?? t("actionError")),
        );
        return;
      }

      setConfirmingAction(null);

      if (action === "delete" && redirectAfterDelete) {
        router.push("/workouts");
        return;
      }

      router.refresh();
    } catch {
      setError(t("connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmingAction) {
    return (
      <div className="w-full rounded-lg border border-border bg-surface-elevated p-4 text-left">
        <p className="text-sm font-semibold">{t(`${action}ConfirmTitle`)}</p>
        <p className="mt-1 text-sm text-muted">
          {t(`${action}ConfirmDescription`)}
        </p>

        {error && (
          <Alert variant="error" className="mt-3 px-3 py-2">
            {error}
          </Alert>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              setError(null);
              setConfirmingAction(null);
            }}
          >
            {t("cancel")}
          </Button>

          <Button
            type="button"
            variant={action === "delete" ? "danger" : "primary"}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={handleAction}
          >
            {isSubmitting ? t(`${action}Submitting`) : t(action)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={action === "delete" ? "danger" : "secondary"}
      onClick={() => {
        setError(null);
        setConfirmingAction(action);
      }}
    >
      {t(action)}
    </Button>
  );
}
