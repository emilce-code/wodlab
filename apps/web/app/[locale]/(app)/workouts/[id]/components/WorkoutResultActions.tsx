"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

import LogResultForm, {
  PrescriptionCategory,
  ResultType,
  WeightUnit,
  WorkoutResultForEdit,
  WorkoutVariant,
} from "./LogResultForm";

type Props = {
  workoutId: string;
  result: WorkoutResultForEdit;
  resultType: ResultType;
  variants: WorkoutVariant[];
  prescriptionCategories: PrescriptionCategory[];
  preferredWeightUnit: WeightUnit;
};

export default function WorkoutResultActions({
  workoutId,
  result,
  resultType,
  variants,
  prescriptionCategories,
  preferredWeightUnit,
}: Props) {
  const t = useTranslations("workouts.detail.history");
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/workouts/${workoutId}/results/${result.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        setDeleteError(message ?? t("deleteError"));

        return;
      }

      router.refresh();
    } catch {
      setDeleteError(t("deleteConnectionError"));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <div className="mt-4 text-left">
        <LogResultForm
          key={result.id}
          workoutId={workoutId}
          resultType={resultType}
          variants={variants}
          prescriptionCategories={prescriptionCategories}
          preferredWeightUnit={preferredWeightUnit}
          result={result}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </div>
    );
  }

  if (isConfirmingDelete) {
    return (
      <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
        <p className="text-sm font-semibold text-red-500">
          {t("deleteConfirmTitle")}
        </p>

        <p className="mt-1 text-sm text-muted">
          {t("deleteConfirmDescription")}
        </p>

        {deleteError && (
          <Alert variant="error" className="mt-3 px-3 py-2">
            {deleteError}
          </Alert>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setIsConfirmingDelete(false);
            }}
            disabled={isDeleting}
            variant="secondary"
            className="min-h-10 px-4 py-2"
          >
            {t("cancelDelete")}
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            variant="danger"
            className="min-h-10 px-4 py-2"
          >
            {isDeleting ? t("deleting") : t("confirmDelete")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <Button
        type="button"
        onClick={() => {
          setDeleteError(null);
          setIsEditing(true);
        }}
        variant="secondary"
        className="min-h-10 px-4 py-2"
      >
        {t("edit")}
      </Button>

      <Button
        type="button"
        onClick={() => {
          setDeleteError(null);
          setIsConfirmingDelete(true);
        }}
        variant="danger"
        className="min-h-10 bg-transparent px-4 py-2 hover:bg-red-500/5"
      >
        {t("delete")}
      </Button>
    </div>
  );
}
