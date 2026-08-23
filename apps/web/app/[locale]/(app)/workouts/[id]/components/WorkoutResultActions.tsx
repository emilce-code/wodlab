'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import LogResultForm, {
  PrescriptionCategory,
  ResultType,
  WeightUnit,
  WorkoutResultForEdit,
  WorkoutVariant,
} from './LogResultForm';

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
  const t = useTranslations('workouts.detail.history');
  const [isEditing, setIsEditing] = useState(false);

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

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent/40 hover:bg-surface-elevated"
    >
      {t('edit')}
    </button>
  );
}