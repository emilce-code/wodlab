'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  useTranslations,
} from 'next-intl';

import {
  useRouter,
} from '@/i18n/navigation';

import Card from '@/components/ui/Card';

type WeightUnit =
  | 'KG'
  | 'LB';

type WorkoutLevel = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

type PrescriptionCategory = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

type Profile = {
  displayName: string;
  preferredWeightUnit:
    WeightUnit;

  preferredWorkoutLevelKey:
    string;

  preferredPrescriptionCategoryKey:
    string;
};

type Props = {
  email: string;
  profile: Profile;
  workoutLevels:
    WorkoutLevel[];
  prescriptionCategories:
    PrescriptionCategory[];
};

export default function AthleteProfileForm({
  email,
  profile,
  workoutLevels,
  prescriptionCategories,
}: Props) {
  const t =
    useTranslations(
      'account.profile',
    );

  const router =
    useRouter();

  const [
    displayName,
    setDisplayName,
  ] = useState(
    profile.displayName,
  );

  const [
    preferredWeightUnit,
    setPreferredWeightUnit,
  ] = useState<WeightUnit>(
    profile.preferredWeightUnit,
  );

  const [
    preferredWorkoutLevelKey,
    setPreferredWorkoutLevelKey,
  ] = useState(
    profile.preferredWorkoutLevelKey,
  );

  const [
    preferredPrescriptionCategoryKey,
    setPreferredPrescriptionCategoryKey,
  ] = useState(
    profile.preferredPrescriptionCategoryKey,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    success,
    setSuccess,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError(
        t(
          'validation.displayNameRequired',
        ),
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        await fetch(
          '/api/athlete-profile',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                displayName:
                  displayName.trim(),

                preferredWeightUnit,

                preferredWorkoutLevelKey:
                  preferredWorkoutLevelKey ||
                  null,

                preferredPrescriptionCategoryKey:
                  preferredPrescriptionCategoryKey ||
                  null,
              }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        const message =
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ', ',
              )
            : data.message;

        setError(
          message ??
            t(
              'validation.saveError',
            ),
        );

        return;
      }

      setSuccess(true);

      router.refresh();
    } catch {
      setError(
        t(
          'validation.connectionError',
        ),
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  return (
    <Card className="p-6">
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="grid gap-5">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'displayName',
              )}
            </label>

            <input
              id="displayName"
              type="text"
              value={
                displayName
              }
              onChange={(
                event,
              ) => {
                setDisplayName(
                  event.target
                    .value,
                );

                setSuccess(
                  false,
                );
              }}
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              {t('email')}
            </label>

            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-muted opacity-80"
            />

            <p className="mt-1.5 text-xs text-muted">
              {t(
                'emailDescription',
              )}
            </p>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-sm font-bold">
              {t(
                'trainingPreferences',
              )}
            </p>

            <p className="mt-1 text-sm text-muted">
              {t(
                'trainingPreferencesDescription',
              )}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="preferredWeightUnit"
                className="mb-1.5 block text-sm font-medium"
              >
                {t(
                  'weightUnit',
                )}
              </label>

              <select
                id="preferredWeightUnit"
                value={
                  preferredWeightUnit
                }
                onChange={(
                  event,
                ) => {
                  setPreferredWeightUnit(
                    event
                      .target
                      .value as WeightUnit,
                  );

                  setSuccess(
                    false,
                  );
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              >
                <option value="KG">
                  {t(
                    'kilograms',
                  )}
                </option>

                <option value="LB">
                  {t(
                    'pounds',
                  )}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="preferredWorkoutLevel"
                className="mb-1.5 block text-sm font-medium"
              >
                {t(
                  'workoutLevel',
                )}
              </label>

              <select
                id="preferredWorkoutLevel"
                value={
                  preferredWorkoutLevelKey
                }
                onChange={(
                  event,
                ) => {
                  setPreferredWorkoutLevelKey(
                    event.target
                      .value,
                  );

                  setSuccess(
                    false,
                  );
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
              >
                <option value="">
                  {t(
                    'noWorkoutLevelPreference',
                  )}
                </option>

                {workoutLevels.map(
                  (level) => (
                    <option
                      key={
                        level.key
                      }
                      value={
                        level.key
                      }
                    >
                      {
                        level.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="preferredPrescriptionCategory"
              className="mb-1.5 block text-sm font-medium"
            >
              {t(
                'prescriptionCategory',
              )}
            </label>

            <select
              id="preferredPrescriptionCategory"
              value={
                preferredPrescriptionCategoryKey
              }
              onChange={(
                event,
              ) => {
                setPreferredPrescriptionCategoryKey(
                  event.target
                    .value,
                );

                setSuccess(
                  false,
                );
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            >
              <option value="">
                {t(
                  'noPrescriptionPreference',
                )}
              </option>

              {prescriptionCategories.map(
                (
                  category,
                ) => (
                  <option
                    key={
                      category.key
                    }
                    value={
                      category.key
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                ),
              )}
            </select>

            <p className="mt-1.5 text-xs text-muted">
              {t(
                'prescriptionDescription',
              )}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent"
            >
              {t(
                'saved',
              )}
            </div>
          )}

          <div className="flex justify-end border-t border-border pt-5">
            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="inline-flex min-w-32 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? t(
                    'saving',
                  )
                : t(
                    'save',
                  )}
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}