"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";

type Props = {
  workoutId: string;
};

const labels = {
  en: {
    action: "Copy to Box",
    copying: "Copying...",
    error: "Unable to copy this workout to your active Box.",
  },
  es: {
    action: "Copiar al Box",
    copying: "Copiando...",
    error: "No se pudo copiar este workout al Box activo.",
  },
  pt: {
    action: "Copiar para o Box",
    copying: "Copiando...",
    error: "Não foi possível copiar este treino para o Box ativo.",
  },
} as const;

export default function WorkoutCopyToBoxAction({ workoutId }: Props) {
  const locale = useLocale();
  const copy = labels[locale as keyof typeof labels] ?? labels.en;
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/workouts/${encodeURIComponent(workoutId)}/copy-to-box`,
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as {
        id?: string;
        message?: string | string[];
      };

      if (!response.ok || !data.id) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : (data.message ?? copy.error),
        );
        return;
      }

      router.push(`/workouts/${data.id}`);
      router.refresh();
    } catch {
      setError(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      {error ? (
        <Alert variant="error" className="mb-2 px-3 py-2 text-xs">
          {error}
        </Alert>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        onClick={() => void handleCopy()}
      >
        {isSubmitting ? copy.copying : copy.action}
      </Button>
    </div>
  );
}
