"use client";

import { FormEvent, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { WeightUnit } from "@/lib/result-types";

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
  leaderboardEnabled: boolean;
  preferredWeightUnit: WeightUnit;

  preferredWorkoutLevelKey: string;

  preferredPrescriptionCategoryKey: string;
  avatarUrl: string;
  bio: string;
  trainingGoals: TrainingGoal[];
  weeklyTrainingTarget: number | null;
  loadRoundingIncrement: number | null;
};

type TrainingGoal =
  | "GENERAL_FITNESS"
  | "STRENGTH"
  | "CONDITIONING"
  | "GYMNASTICS"
  | "WEIGHTLIFTING"
  | "COMPETITION";

const trainingGoals: TrainingGoal[] = [
  "GENERAL_FITNESS",
  "STRENGTH",
  "CONDITIONING",
  "GYMNASTICS",
  "WEIGHTLIFTING",
  "COMPETITION",
];

type Props = {
  email: string;
  profile: Profile;
  workoutLevels: WorkoutLevel[];
  prescriptionCategories: PrescriptionCategory[];
};

export default function AthleteProfileForm({
  email,
  profile,
  workoutLevels,
  prescriptionCategories,
}: Props) {
  const t = useTranslations("account.profile");

  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile.displayName);

  const [leaderboardEnabled, setLeaderboardEnabled] = useState(
    profile.leaderboardEnabled,
  );

  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>(
    profile.preferredWeightUnit,
  );

  const [preferredWorkoutLevelKey, setPreferredWorkoutLevelKey] = useState(
    profile.preferredWorkoutLevelKey,
  );

  const [
    preferredPrescriptionCategoryKey,
    setPreferredPrescriptionCategoryKey,
  ] = useState(profile.preferredPrescriptionCategoryKey);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bio, setBio] = useState(profile.bio);
  const [selectedGoals, setSelectedGoals] = useState<TrainingGoal[]>(
    profile.trainingGoals,
  );
  const [weeklyTrainingTarget, setWeeklyTrainingTarget] = useState(
    profile.weeklyTrainingTarget?.toString() ?? "",
  );
  const [loadRoundingIncrement, setLoadRoundingIncrement] = useState(
    profile.loadRoundingIncrement?.toString() ?? "",
  );

  const isDirty = useMemo(
    () =>
      displayName !== profile.displayName ||
      leaderboardEnabled !== profile.leaderboardEnabled ||
      preferredWeightUnit !== profile.preferredWeightUnit ||
      preferredWorkoutLevelKey !== profile.preferredWorkoutLevelKey ||
      preferredPrescriptionCategoryKey !==
        profile.preferredPrescriptionCategoryKey ||
      avatarUrl !== profile.avatarUrl ||
      bio !== profile.bio ||
      weeklyTrainingTarget !==
        (profile.weeklyTrainingTarget?.toString() ?? "") ||
      loadRoundingIncrement !==
        (profile.loadRoundingIncrement?.toString() ?? "") ||
      selectedGoals.join(",") !== profile.trainingGoals.join(","),
    [
      avatarUrl,
      bio,
      displayName,
      leaderboardEnabled,
      loadRoundingIncrement,
      preferredPrescriptionCategoryKey,
      preferredWeightUnit,
      preferredWorkoutLevelKey,
      profile,
      selectedGoals,
      weeklyTrainingTarget,
    ],
  );

  function toggleGoal(goal: TrainingGoal) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : trainingGoals.filter(
            (item) => item === goal || current.includes(item),
          ),
    );
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError(t("validation.displayNameRequired"));

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/athlete-profile", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          displayName: displayName.trim(),

          leaderboardEnabled,

          preferredWeightUnit,

          preferredWorkoutLevelKey: preferredWorkoutLevelKey || null,

          preferredPrescriptionCategoryKey:
            preferredPrescriptionCategoryKey || null,
          avatarUrl: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          trainingGoals: selectedGoals,
          weeklyTrainingTarget: weeklyTrainingTarget
            ? Number(weeklyTrainingTarget)
            : null,
          loadRoundingIncrement: loadRoundingIncrement
            ? Number(loadRoundingIncrement)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        setError(message ?? t("validation.saveError"));

        return;
      }

      setSuccess(true);

      router.refresh();
    } catch {
      setError(t("validation.connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5">
          <details open className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              {t("identity")}
              <span
                aria-hidden="true"
                className="text-muted transition group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="grid gap-5 pt-4">
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("displayName")}
                </label>

                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);

                    setSuccess(false);
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
                  {t("email")}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-muted opacity-80"
                />

                <p className="mt-1.5 text-xs text-muted">
                  {t("emailDescription")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="avatarUrl"
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("avatarUrl")}
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  inputMode="url"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    setSuccess(false);
                  }}
                  placeholder="https://"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
                <p className="mt-1.5 text-xs text-muted">
                  {t("avatarDescription")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("bio")}
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  maxLength={280}
                  rows={3}
                  onChange={(event) => {
                    setBio(event.target.value);
                    setSuccess(false);
                  }}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                />
                <p className="mt-1.5 text-right text-xs text-muted">
                  {bio.length}/280
                </p>
              </div>
            </div>
          </details>

          <details open className="group border-t border-border pt-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              <span>
                <p className="text-sm font-bold">{t("trainingPreferences")}</p>

                <p className="mt-1 text-sm text-muted">
                  {t("trainingPreferencesDescription")}
                </p>
              </span>
              <span
                aria-hidden="true"
                className="text-muted transition group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="grid gap-5 pt-4">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="preferredWeightUnit"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("weightUnit")}
                  </label>

                  <div
                    className="grid grid-cols-2 rounded-xl border border-border bg-background p-1"
                    role="group"
                    aria-label={t("weightUnit")}
                  >
                    {(["KG", "LB"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={preferredWeightUnit === unit}
                        onClick={() => {
                          setPreferredWeightUnit(unit);
                          setSuccess(false);
                        }}
                        className={`min-h-11 rounded-lg text-sm font-bold transition ${preferredWeightUnit === unit ? "bg-accent text-black" : "text-muted hover:text-foreground"}`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="preferredWorkoutLevel"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("workoutLevel")}
                  </label>

                  <select
                    id="preferredWorkoutLevel"
                    value={preferredWorkoutLevelKey}
                    onChange={(event) => {
                      setPreferredWorkoutLevelKey(event.target.value);

                      setSuccess(false);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  >
                    <option value="">{t("noWorkoutLevelPreference")}</option>

                    {workoutLevels.map((level) => (
                      <option key={level.key} value={level.key}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-medium">
                  {t("goals.title")}
                </legend>
                <p className="mt-1 text-xs text-muted">
                  {t("goals.description")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trainingGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      aria-pressed={selectedGoals.includes(goal)}
                      onClick={() => toggleGoal(goal)}
                      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${selectedGoals.includes(goal) ? "border-accent bg-accent/15 text-accent" : "border-border bg-background text-muted hover:text-foreground"}`}
                    >
                      {t(`goals.options.${goal}`)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="weeklyTrainingTarget"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("weeklyTarget")}
                  </label>
                  <select
                    id="weeklyTrainingTarget"
                    value={weeklyTrainingTarget}
                    onChange={(event) => {
                      setWeeklyTrainingTarget(event.target.value);
                      setSuccess(false);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  >
                    <option value="">{t("notSet")}</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                      <option key={days} value={days}>
                        {t("daysPerWeek", { count: days })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="loadRoundingIncrement"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {t("loadRounding")}
                  </label>
                  <select
                    id="loadRoundingIncrement"
                    value={loadRoundingIncrement}
                    onChange={(event) => {
                      setLoadRoundingIncrement(event.target.value);
                      setSuccess(false);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                  >
                    <option value="">{t("notSet")}</option>
                    {[0.5, 1, 2.5, 5].map((increment) => (
                      <option key={increment} value={increment}>
                        {increment} {preferredWeightUnit.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="preferredPrescriptionCategory"
                  className="mb-1.5 block text-sm font-medium"
                >
                  {t("prescriptionCategory")}
                </label>

                <select
                  id="preferredPrescriptionCategory"
                  value={preferredPrescriptionCategoryKey}
                  onChange={(event) => {
                    setPreferredPrescriptionCategoryKey(event.target.value);

                    setSuccess(false);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
                >
                  <option value="">{t("noPrescriptionPreference")}</option>

                  {prescriptionCategories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-muted">
                  {t("prescriptionDescription")}
                </p>
              </div>
            </div>
          </details>

          <details className="group border-t border-border pt-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              {t("privacy")}
              <span
                aria-hidden="true"
                className="text-muted transition group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <div className="pt-4">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4">
                <input
                  type="checkbox"
                  checked={leaderboardEnabled}
                  onChange={(event) => {
                    setLeaderboardEnabled(event.target.checked);
                    setSuccess(false);
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {t("leaderboard.title")}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {t("leaderboard.description")}
                  </span>
                </span>
              </label>
              <div className="mt-3 rounded-xl border border-dashed border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {t("leaderboard.preview")}
                </p>
                <p className="mt-2 font-bold">
                  {leaderboardEnabled
                    ? displayName || t("leaderboard.athlete")
                    : t("leaderboard.hidden")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {leaderboardEnabled
                    ? t("leaderboard.visibleDescription")
                    : t("leaderboard.hiddenDescription")}
                </p>
              </div>
            </div>
          </details>

          {error && <Alert variant="error">{error}</Alert>}

          {success && <Alert variant="success">{t("saved")}</Alert>}

          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex justify-end border-t border-border bg-surface/95 px-4 pb-1 pt-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:backdrop-blur-none">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!isDirty || isSubmitting}
              className="w-full sm:w-auto sm:min-w-32"
            >
              {isSubmitting
                ? t("saving")
                : isDirty
                  ? t("save")
                  : t("savedState")}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
