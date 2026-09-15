"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";

type LifecycleWorkout = {
  id: string;
  isActive: boolean;
  canDelete: boolean;
};

type Props = {
  workout: LifecycleWorkout;
  redirectAfterDelete?: boolean;
};

type LifecycleAction = "delete" | "deactivate" | "reactivate";

const archiveLabels = {
  en: {
    archive: "Archive",
    delete: "Delete",
    reactivate: "Reactivate",
  },
  es: {
    archive: "Archivar",
    delete: "Eliminar",
    reactivate: "Reactivar",
  },
  pt: {
    archive: "Arquivar",
    delete: "Excluir",
    reactivate: "Reativar",
  },
} as const;

export default function WorkoutLifecycleActions({
  workout,
  redirectAfterDelete = false,
}: Props) {
  const t = useTranslations("workouts.lifecycle");
  const locale = useLocale();
  const labels =
    archiveLabels[locale as keyof typeof archiveLabels] ?? archiveLabels.en;
  const router = useRouter();

  const [confirmingAction, setConfirmingAction] =
    useState<LifecycleAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: LifecycleAction) {
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

      const data = (await response.json()) as {
        message?: string | string[];
      };

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
    const action = confirmingAction;

    return (
      <div className="w-full rounded-lg border border-border bg-surface-elevated p-4 text-left">
        <p className="text-sm font-semibold">
          {t(`${action}ConfirmTitle`)}
        </p>

        <p className="mt-1 text-sm text-muted">
          {t(`${action}ConfirmDescription`)}
        </p>

        {error ? (
          <Alert variant="error" className="mt-3 px-3 py-2">
            {error}
          </Alert>
        ) : null}

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
            onClick={() => void handleAction(action)}
          >
            {isSubmitting ? t(`${action}Submitting`) : t(action)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 min-[390px]:flex-row sm:w-auto">
      {workout.isActive ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full min-[390px]:w-auto"
          onClick={() => {
            setError(null);
            setConfirmingAction("deactivate");
          }}
        >
          {labels.archive}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full min-[390px]:w-auto"
          onClick={() => {
            setError(null);
            setConfirmingAction("reactivate");
          }}
        >
          {labels.reactivate}
        </Button>
      )}

      {workout.canDelete ? (
        <Button
          type="button"
          size="sm"
          variant="danger"
          className="w-full min-[390px]:w-auto"
          onClick={() => {
            setError(null);
            setConfirmingAction("delete");
          }}
        >
          {labels.delete}
        </Button>
      ) : null}
    </div>
  );
}
