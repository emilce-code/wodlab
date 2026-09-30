"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { WeightUnit } from "@/lib/result-types";
import { mediaImageUrl, optimizeProfileImage } from "@/lib/profile-images";

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

type TrainingGoal =
  | "GENERAL_FITNESS"
  | "STRENGTH"
  | "CONDITIONING"
  | "GYMNASTICS"
  | "WEIGHTLIFTING"
  | "COMPETITION";

type Profile = {
  displayName: string;
  leaderboardEnabled: boolean;
  preferredWeightUnit: WeightUnit;
  preferredWorkoutLevelKey: string;
  preferredPrescriptionCategoryKey: string;
  avatarPath: string;
  bio: string;
  trainingGoals: TrainingGoal[];
  weeklyTrainingTarget: number | null;
  loadRoundingIncrement: number | null;
};

type FormSnapshot = {
  displayName: string;
  leaderboardEnabled: boolean;
  preferredWeightUnit: WeightUnit;
  preferredWorkoutLevelKey: string;
  preferredPrescriptionCategoryKey: string;
  bio: string;
  selectedGoals: TrainingGoal[];
  weeklyTrainingTarget: string;
  loadRoundingIncrement: string;
};

type Props = {
  email: string;
  profile: Profile;
  workoutLevels: WorkoutLevel[];
  prescriptionCategories: PrescriptionCategory[];
};

const trainingGoals: TrainingGoal[] = [
  "GENERAL_FITNESS",
  "STRENGTH",
  "CONDITIONING",
  "GYMNASTICS",
  "WEIGHTLIFTING",
  "COMPETITION",
];

function snapshotFromProfile(profile: Profile): FormSnapshot {
  return {
    displayName: profile.displayName,
    leaderboardEnabled: profile.leaderboardEnabled,
    preferredWeightUnit: profile.preferredWeightUnit,
    preferredWorkoutLevelKey: profile.preferredWorkoutLevelKey,
    preferredPrescriptionCategoryKey: profile.preferredPrescriptionCategoryKey,
    bio: profile.bio,
    selectedGoals: profile.trainingGoals,
    weeklyTrainingTarget: profile.weeklyTrainingTarget?.toString() ?? "",
    loadRoundingIncrement: profile.loadRoundingIncrement?.toString() ?? "",
  };
}

function goalsKey(goals: TrainingGoal[]) {
  return [...goals].sort().join(",");
}

export default function AthleteProfileForm({
  email,
  profile,
  workoutLevels,
  prescriptionCategories,
}: Props) {
  const t = useTranslations("account.profile");
  const router = useRouter();

  const [saved, setSaved] = useState<FormSnapshot>(() =>
    snapshotFromProfile(profile),
  );
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath);
  const [displayName, setDisplayName] = useState(saved.displayName);
  const [bio, setBio] = useState(saved.bio);
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>(
    saved.preferredWeightUnit,
  );
  const [preferredWorkoutLevelKey, setPreferredWorkoutLevelKey] = useState(
    saved.preferredWorkoutLevelKey,
  );
  const [
    preferredPrescriptionCategoryKey,
    setPreferredPrescriptionCategoryKey,
  ] = useState(saved.preferredPrescriptionCategoryKey);
  const [selectedGoals, setSelectedGoals] = useState<TrainingGoal[]>(
    saved.selectedGoals,
  );
  const [weeklyTrainingTarget, setWeeklyTrainingTarget] = useState(
    saved.weeklyTrainingTarget,
  );
  const [loadRoundingIncrement, setLoadRoundingIncrement] = useState(
    saved.loadRoundingIncrement,
  );
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(
    saved.leaderboardEnabled,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const displayNameValue = displayName || email;
  const avatarSrc = mediaImageUrl(avatarPath);
  const initials = displayNameValue
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentSnapshot = useMemo<FormSnapshot>(
    () => ({
      displayName,
      leaderboardEnabled,
      preferredWeightUnit,
      preferredWorkoutLevelKey,
      preferredPrescriptionCategoryKey,
      bio,
      selectedGoals,
      weeklyTrainingTarget,
      loadRoundingIncrement,
    }),
    [
      bio,
      displayName,
      leaderboardEnabled,
      loadRoundingIncrement,
      preferredPrescriptionCategoryKey,
      preferredWeightUnit,
      preferredWorkoutLevelKey,
      selectedGoals,
      weeklyTrainingTarget,
    ],
  );

  const isDirty = useMemo(
    () =>
      currentSnapshot.displayName !== saved.displayName ||
      currentSnapshot.leaderboardEnabled !== saved.leaderboardEnabled ||
      currentSnapshot.preferredWeightUnit !== saved.preferredWeightUnit ||
      currentSnapshot.preferredWorkoutLevelKey !==
        saved.preferredWorkoutLevelKey ||
      currentSnapshot.preferredPrescriptionCategoryKey !==
        saved.preferredPrescriptionCategoryKey ||
      currentSnapshot.bio !== saved.bio ||
      currentSnapshot.weeklyTrainingTarget !== saved.weeklyTrainingTarget ||
      currentSnapshot.loadRoundingIncrement !== saved.loadRoundingIncrement ||
      goalsKey(currentSnapshot.selectedGoals) !== goalsKey(saved.selectedGoals),
    [currentSnapshot, saved],
  );

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, feedback.type === "error" ? 7000 : 4500);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function markChanged() {
    setFeedback(null);
  }

  function resetForm() {
    setDisplayName(saved.displayName);
    setLeaderboardEnabled(saved.leaderboardEnabled);
    setPreferredWeightUnit(saved.preferredWeightUnit);
    setPreferredWorkoutLevelKey(saved.preferredWorkoutLevelKey);
    setPreferredPrescriptionCategoryKey(saved.preferredPrescriptionCategoryKey);
    setBio(saved.bio);
    setSelectedGoals(saved.selectedGoals);
    setWeeklyTrainingTarget(saved.weeklyTrainingTarget);
    setLoadRoundingIncrement(saved.loadRoundingIncrement);
    setFeedback(null);
  }

  function toggleGoal(goal: TrainingGoal) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : trainingGoals.filter(
            (item) => item === goal || current.includes(item),
          ),
    );
    markChanged();
  }

  async function uploadAvatar(file: File) {
    setFeedback(null);
    setIsUploadingAvatar(true);

    try {
      const optimized = await optimizeProfileImage(file);
      const form = new FormData();
      form.set("file", optimized);

      const response = await fetch("/api/athlete-profile/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || t("validation.saveError"));
      }

      setAvatarPath(data.path as string);
      setFeedback({ type: "success", message: t("photoSaved") });
      router.refresh();
    } catch (caught) {
      setFeedback({
        type: "error",
        message:
          caught instanceof Error ? caught.message : t("validation.saveError"),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!displayName.trim()) {
      setFeedback({
        type: "error",
        message: t("validation.displayNameRequired"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/athlete-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          leaderboardEnabled,
          preferredWeightUnit,
          preferredWorkoutLevelKey: preferredWorkoutLevelKey || null,
          preferredPrescriptionCategoryKey:
            preferredPrescriptionCategoryKey || null,
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

        setFeedback({
          type: "error",
          message: message ?? t("validation.saveError"),
        });
        return;
      }

      const nextSaved = {
        ...currentSnapshot,
        displayName: displayName.trim(),
        bio: bio.trim(),
      };
      setSaved(nextSaved);
      setDisplayName(nextSaved.displayName);
      setBio(nextSaved.bio);
      setFeedback({ type: "success", message: t("saved") });
      router.refresh();
    } catch {
      setFeedback({ type: "error", message: t("validation.connectionError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback ? <FeedbackToast feedback={feedback} /> : null}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-accent/40 bg-background text-xl font-black text-accent">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={t("avatarAlt", { name: displayNameValue })}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              initials
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/75 py-1.5 text-center text-[10px] font-bold text-white">
              {isUploadingAvatar ? t("uploadingPhoto") : t("changePhoto")}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isUploadingAvatar}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (file) void uploadAvatar(file);
              }}
            />
          </label>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-xl font-bold">{displayNameValue}</p>
              {isDirty ? (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-black text-black">
                  {t("unsaved")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted">{email}</p>
            <p className="mt-3 text-xs leading-5 text-muted">
              {t("photoDescription")}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle title={t("basicProfile")} />

        <div className="mt-4 grid gap-4">
          <Field label={t("displayName")} htmlFor="displayName">
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                markChanged();
              }}
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
          </Field>

          <Field label={t("bio")} htmlFor="bio">
            <textarea
              id="bio"
              value={bio}
              maxLength={280}
              rows={3}
              onChange={(event) => {
                setBio(event.target.value);
                markChanged();
              }}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
            />
            <p className="mt-1.5 text-right text-xs text-muted">
              {bio.length}/280
            </p>
          </Field>

          <Field label={t("email")} htmlFor="email">
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
          </Field>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle
          title={t("trainingDefaults")}
          description={t("trainingPreferencesDescription")}
        />

        <div className="mt-4 grid gap-4">
          <Field label={t("weightUnit")} htmlFor="preferredWeightUnit">
            <div
              className="grid grid-cols-2 rounded-lg border border-border bg-background p-1"
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
                    markChanged();
                  }}
                  className={`min-h-11 rounded-md text-sm font-bold transition ${
                    preferredWeightUnit === unit
                      ? "bg-accent text-black"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {unit.toLowerCase()}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("workoutLevel")} htmlFor="preferredWorkoutLevel">
            <select
              id="preferredWorkoutLevel"
              value={preferredWorkoutLevelKey}
              onChange={(event) => {
                setPreferredWorkoutLevelKey(event.target.value);
                markChanged();
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
          </Field>

          <Field
            label={t("prescriptionCategory")}
            htmlFor="preferredPrescriptionCategory"
          >
            <select
              id="preferredPrescriptionCategory"
              value={preferredPrescriptionCategoryKey}
              onChange={(event) => {
                setPreferredPrescriptionCategoryKey(event.target.value);
                markChanged();
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
          </Field>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
            <span>
              <span className="block text-base font-bold">
                {t("morePreferences")}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {t("morePreferencesDescription")}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-muted transition group-open:rotate-180"
            >
              ^
            </span>
          </summary>

          <div className="mt-4 space-y-5">
            <fieldset>
              <legend className="text-sm font-medium">{t("goals.title")}</legend>
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
                    className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
                      selectedGoals.includes(goal)
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {t(`goals.options.${goal}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("weeklyTarget")} htmlFor="weeklyTrainingTarget">
                <select
                  id="weeklyTrainingTarget"
                  value={weeklyTrainingTarget}
                  onChange={(event) => {
                    setWeeklyTrainingTarget(event.target.value);
                    markChanged();
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
              </Field>

              <Field label={t("loadRounding")} htmlFor="loadRoundingIncrement">
                <select
                  id="loadRoundingIncrement"
                  value={loadRoundingIncrement}
                  onChange={(event) => {
                    setLoadRoundingIncrement(event.target.value);
                    markChanged();
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
              </Field>
            </div>

            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4">
              <input
                type="checkbox"
                checked={leaderboardEnabled}
                onChange={(event) => {
                  setLeaderboardEnabled(event.target.checked);
                  markChanged();
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
          </div>
        </details>
      </Card>

      {(isDirty || isSubmitting) && (
        <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-border bg-surface/95 p-3 shadow-[0_-12px_32px_rgba(0,0,0,0.28)] backdrop-blur sm:hidden">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-bold">{t("unsaved")}</p>
            <p className="mt-0.5 text-xs text-muted">{t("unsavedHelp")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={resetForm}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                {t("saveShort")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden justify-end gap-3 sm:flex">
        <Button
          type="button"
          variant="secondary"
          onClick={resetForm}
          disabled={!isDirty || isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          {isDirty ? t("save") : t("savedState")}
        </Button>
      </div>
    </form>
  );
}

function FeedbackToast({
  feedback,
}: {
  feedback: { type: "success" | "error"; message: string };
}) {
  const isError = feedback.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[80] mx-auto max-w-md sm:left-auto sm:right-6 sm:top-6 sm:mx-0"
    >
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur ${
          isError
            ? "border-red-500/40 bg-red-950/95 text-red-50"
            : "border-accent/50 bg-accent text-black"
        }`}
      >
        {feedback.message}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-base font-bold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
