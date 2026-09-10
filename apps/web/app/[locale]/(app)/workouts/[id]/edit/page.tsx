import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import PageHeader from "@/components/layout/PageHeader";
import { Link } from "@/i18n/navigation";
import { authenticatedApiFetchJson } from "@/lib/api";

import type {
  PrescriptionCategory,
  WorkoutLevel,
  WorkoutType,
} from "../../new/page";
import WorkoutForm, {
  type EditableWorkout,
} from "../../new/components/WorkoutForm";

type Props = { params: Promise<{ id: string }> };
type ManagedWorkout = EditableWorkout & { canEdit: boolean };

export default async function EditWorkoutPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("workouts.create");

  let workout: ManagedWorkout;
  try {
    workout = await authenticatedApiFetchJson<ManagedWorkout>(`/workouts/${id}`);
  } catch {
    notFound();
  }

  if (!workout.canEdit) redirect(`/workouts/${id}`);

  const [workoutTypes, workoutLevels, prescriptionCategories] =
    await Promise.all([
      authenticatedApiFetchJson<WorkoutType[]>("/workouts/types"),
      authenticatedApiFetchJson<WorkoutLevel[]>("/workouts/levels"),
      authenticatedApiFetchJson<PrescriptionCategory[]>(
        "/workouts/prescription-categories",
      ),
    ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/workouts/${id}`} className="text-sm font-semibold text-muted">
        ← {t("backToWorkout")}
      </Link>
      <PageHeader
        className="mt-6"
        eyebrow={t("editEyebrow")}
        title={t("editTitle")}
        description={t("editDescription")}
      />
      <div className="mt-8">
        <WorkoutForm
          workoutTypes={workoutTypes}
          workoutLevels={workoutLevels}
          prescriptionCategories={prescriptionCategories}
          initialWorkout={workout}
        />
      </div>
    </div>
  );
}
