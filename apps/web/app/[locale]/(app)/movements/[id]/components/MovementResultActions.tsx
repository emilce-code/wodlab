'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';

import {
  MeasurementType,
  MovementResult,
  WeightUnit,
} from '../movement-result.types';
import LogMovementResultForm from './LogMovementResultForm';

type Props = {
  movementId: string;
  result: MovementResult;
  measurementTypes: MeasurementType[];
  preferredWeightUnit: WeightUnit;
};

export default function MovementResultActions({
  movementId,
  result,
  measurementTypes,
  preferredWeightUnit,
}: Props) {
  const t = useTranslations('movements.detail.history');
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (result.source.type !== 'MANUAL') {
    return null;
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/movements/${movementId}/results/${result.id}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        setDeleteError(message ?? t('deleteError'));
        return;
      }

      router.refresh();
    } catch {
      setDeleteError(t('deleteConnectionError'));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <div className="mt-4">
        <LogMovementResultForm
          key={result.id}
          movementId={movementId}
          measurementTypes={measurementTypes}
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
          {t('deleteConfirmTitle')}
        </p>

        <p className="mt-1 text-sm text-muted">
          {t('deleteConfirmDescription')}
        </p>

        {deleteError && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500"
          >
            {deleteError}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setIsConfirmingDelete(false);
            }}
            disabled={isDeleting}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('cancelDelete')}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? t('deleting') : t('confirmDelete')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
      <button
        type="button"
        onClick={() => {
          setDeleteError(null);
          setIsEditing(true);
        }}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent/40 hover:bg-surface-elevated"
      >
        {t('edit')}
      </button>

      <button
        type="button"
        onClick={() => {
          setDeleteError(null);
          setIsConfirmingDelete(true);
        }}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/5"
      >
        {t('delete')}
      </button>
    </div>
  );
}