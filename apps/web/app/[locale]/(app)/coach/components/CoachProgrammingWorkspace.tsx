"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import ProgressiveList from "@/components/ui/ProgressiveList";
import MobileDateField from "@/components/ui/MobileDateField";
import type {
  CoachProgrammingWorkspace as Workspace,
  ProgrammingWorkout,
} from "@/lib/coach-programming";

type ProgrammingView = "groups" | "templates";

type DraftItem = {
  dayOffset: number;
  workoutId: string;
  workoutVariantId: string;
  prescriptionCategoryKey: string;
  coachNotes: string;
};

const emptyItem = (): DraftItem => ({
  dayOffset: 0,
  workoutId: "",
  workoutVariantId: "",
  prescriptionCategoryKey: "",
  coachNotes: "",
});

function mondayValue() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function WorkoutSearchPicker({
  workouts,
  selectedId,
  onSelect,
  label,
  placeholder,
  searchPlaceholder,
  noResults,
  resultSummary,
}: {
  workouts: ProgrammingWorkout[];
  selectedId: string;
  onSelect: (workoutId: string) => void;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
  resultSummary: (shown: number, total: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = workouts.find((workout) => workout.id === selectedId);
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return workouts
      .filter((workout) =>
        workout.name.toLocaleLowerCase().includes(normalizedQuery),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [query, workouts]);
  const visibleMatches = matches.slice(0, 20);

  return (
    <div className="min-w-0">
      <span className="text-sm font-semibold">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`mt-1.5 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-left text-base outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/15 ${open ? "border-accent/60" : "border-border"}`}
      >
        <span className={selected ? "min-w-0 truncate font-semibold" : "text-muted"}>
          {selected?.name ?? placeholder}
        </span>
        <span aria-hidden="true" className="shrink-0 text-muted">
          {open ? "⌃" : "⌄"}
        </span>
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl border border-border bg-surface p-3 shadow-lg">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
          />
          <p className="mt-2 px-1 text-xs text-muted" aria-live="polite">
            {resultSummary(visibleMatches.length, matches.length)}
          </p>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain">
            {visibleMatches.map((workout) => (
              <button
                key={workout.id}
                type="button"
                onClick={() => {
                  onSelect(workout.id);
                  setQuery("");
                  setOpen(false);
                }}
                className={`flex min-h-12 w-full items-center rounded-xl px-3 text-left text-sm transition hover:bg-surface-elevated ${workout.id === selectedId ? "bg-accent/10 font-bold text-accent" : ""}`}
              >
                <span className="min-w-0 break-words">{workout.name}</span>
              </button>
            ))}
            {visibleMatches.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {noResults}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CoachProgrammingWorkspace({
  view = "templates",
}: {
  view?: ProgrammingView;
}) {
  const t = useTranslations("coachProgramming");
  const levelT = useTranslations("workoutLevels.names");
  const prescriptionT = useTranslations("prescriptionCategories");
  const { confirm, dialog } = useConfirmationDialog();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [memberSelections, setMemberSelections] = useState<
    Record<string, string>
  >({});
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [applyGroup, setApplyGroup] = useState<Record<string, string>>({});
  const [applyWeek, setApplyWeek] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const templateReady =
    templateName.trim().length > 0 &&
    items.every((item) => item.workoutId && item.workoutVariantId);

  function levelName(key: string, fallback: string) {
    const translationKey = key.toLowerCase();
    return levelT.has(translationKey) ? levelT(translationKey) : fallback;
  }

  function prescriptionName(key: string, fallback: string) {
    const translationKey = key.toLowerCase();
    return prescriptionT.has(translationKey)
      ? prescriptionT(translationKey)
      : fallback;
  }

  const load = useCallback(async () => {
    const response = await fetch("/api/coach-programming/workspace");
    if (!response.ok) throw new Error();
    setWorkspace((await response.json()) as Workspace);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/coach-programming/workspace")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = (await response.json()) as Workspace;
        if (active) setWorkspace(data);
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function request(path: string, init: RequestInit) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/coach-programming/${path}`, init);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message || t("saveError"));
      }
      await load();
      return response;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("saveError"));
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await request("groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupName,
        ...(groupDescription.trim() ? { description: groupDescription } : {}),
      }),
    });
    if (response) {
      setGroupName("");
      setGroupDescription("");
      setSuccess(t("groupCreated"));
      setCreateGroupOpen(false);
    }
  }

  async function deleteGroup(id: string, name: string) {
    if (!(await confirm({ description: t("deleteGroupConfirm", { name }) })))
      return;
    const response = await request(`groups/${id}`, { method: "DELETE" });
    if (response) setSuccess(t("groupDeleted"));
  }

  async function addMember(groupId: string) {
    const athleteProfileId = memberSelections[groupId];
    if (!athleteProfileId) return;
    const response = await request(`groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteProfileId }),
    });
    if (response) {
      setMemberSelections((current) => ({ ...current, [groupId]: "" }));
      setSuccess(t("memberAdded"));
    }
  }

  async function removeMember(groupId: string, athleteProfileId: string) {
    const response = await request(
      `groups/${groupId}/members/${athleteProfileId}`,
      { method: "DELETE" },
    );
    if (response) setSuccess(t("memberRemoved"));
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function selectWorkout(index: number, workoutId: string) {
    const workout = workspace?.workouts.find((item) => item.id === workoutId);
    updateItem(index, {
      workoutId,
      workoutVariantId: workout?.variants[0]?.id ?? "",
    });
  }

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await request("templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: templateName,
        ...(templateDescription.trim()
          ? { description: templateDescription }
          : {}),
        items: items.map((item) => ({
          dayOffset: item.dayOffset,
          workoutId: item.workoutId,
          workoutVariantId: item.workoutVariantId,
          ...(item.prescriptionCategoryKey
            ? { prescriptionCategoryKey: item.prescriptionCategoryKey }
            : {}),
          ...(item.coachNotes.trim() ? { coachNotes: item.coachNotes } : {}),
        })),
      }),
    });
    if (response) {
      setTemplateName("");
      setTemplateDescription("");
      setItems([emptyItem()]);
      setSuccess(t("templateCreated"));
      setCreateTemplateOpen(false);
    }
  }

  async function deleteTemplate(id: string, name: string) {
    if (
      !(await confirm({ description: t("deleteTemplateConfirm", { name }) }))
    )
      return;
    const response = await request(`templates/${id}`, { method: "DELETE" });
    if (response) setSuccess(t("templateDeleted"));
  }

  async function applyTemplate(templateId: string) {
    const groupId = applyGroup[templateId];
    const weekStart = applyWeek[templateId] || mondayValue();
    if (!groupId) {
      setError(t("selectGroupError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/coach-programming/templates/${templateId}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId, weekStart }),
        },
      );
      if (!response.ok) throw new Error(t("applyError"));
      const result = (await response.json()) as {
        created: number;
        skipped: number;
      };
      setSuccess(t("applied", result));
      await load();
    } catch {
      setError(t("applyError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!workspace) {
    return error ? (
      <Alert variant="error" className="mt-8">
        {error}
      </Alert>
    ) : (
      <div className="mt-8 grid gap-4 lg:grid-cols-2" aria-label={t("loading")}>
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="h-40 animate-pulse bg-surface-elevated">
            <span className="sr-only">{t("loading")}</span>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {dialog}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {view === "groups" ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{t("groupsTitle")}</h2>
              <Badge variant="accent">{workspace.groups.length}</Badge>
            </div>
            <ProgressiveList
              initialCount={10}
              increment={10}
              className="mt-4 grid gap-4"
            >
              {workspace.groups.map((group) => {
                const availableAthletes = workspace.athletes.filter(
                  (athlete) =>
                    !group.members.some(
                      (member) => member.athleteProfile.id === athlete.id,
                    ),
                );
                return (
                  <Card key={group.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">{group.name}</h3>
                        {group.description ? (
                          <p className="mt-1 text-sm text-muted">
                            {group.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={submitting}
                        onClick={() => void deleteGroup(group.id, group.name)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.members.length === 0 ? (
                        <p className="text-sm text-muted">{t("emptyGroup")}</p>
                      ) : (
                        group.members.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              void removeMember(
                                group.id,
                                member.athleteProfile.id,
                              )
                            }
                            title={t("removeMember")}
                            className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-red-500 hover:text-red-500"
                          >
                            {member.athleteProfile.displayName} ×
                          </button>
                        ))
                      )}
                    </div>
                    {availableAthletes.length > 0 ? (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={memberSelections[group.id] ?? ""}
                          onChange={(event) =>
                            setMemberSelections((current) => ({
                              ...current,
                              [group.id]: event.target.value,
                            }))
                          }
                          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3"
                        >
                          <option value="">{t("selectAthlete")}</option>
                          {availableAthletes.map((athlete) => (
                            <option key={athlete.id} value={athlete.id}>
                              {athlete.displayName}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={submitting || !memberSelections[group.id]}
                          onClick={() => void addMember(group.id)}
                        >
                          {t("addMember")}
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
              {workspace.groups.length === 0 ? (
                <Card className="p-6 text-center text-muted">
                  {t("noGroups")}
                </Card>
              ) : null}
            </ProgressiveList>
          </div>

          <Card className="h-fit p-5">
            <button
              type="button"
              aria-expanded={createGroupOpen}
              onClick={() => setCreateGroupOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-lg font-bold">{t("createGroup")}</span>
              <span aria-hidden="true">{createGroupOpen ? "−" : "+"}</span>
            </button>
            {createGroupOpen ? (
              <form onSubmit={createGroup} className="mt-4 space-y-3">
                <input
                  aria-label={t("groupName")}
                  required
                  maxLength={100}
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={t("groupName")}
                  className="min-h-12 w-full rounded-lg border border-border bg-background px-3"
                />
                <textarea
                  aria-label={t("groupDescription")}
                  maxLength={500}
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  placeholder={t("groupDescription")}
                  className="min-h-24 w-full resize-y rounded-lg border border-border bg-background p-3"
                />
                <Button type="submit" isLoading={submitting}>
                  {t("saveGroup")}
                </Button>
              </form>
            ) : null}
          </Card>
        </section>
      ) : null}

      {view === "templates" ? (
        <>
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{t("templatesTitle")}</h2>
              <Badge variant="accent">{workspace.templates.length}</Badge>
            </div>
            <ProgressiveList
              initialCount={10}
              increment={10}
              className="mt-4 grid gap-4 lg:grid-cols-2"
            >
              {workspace.templates.map((template) => (
                <Card key={template.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{template.name}</h3>
                      {template.description ? (
                        <p className="mt-1 text-sm text-muted">
                          {template.description}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={submitting}
                      onClick={() =>
                        void deleteTemplate(template.id, template.name)
                      }
                    >
                      {t("delete")}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {template.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-3 text-sm"
                      >
                        <Badge>{t(`days.${item.dayOffset}`)}</Badge>
                        <span className="font-semibold">
                          {item.workout.name}
                        </span>
                        <span className="text-muted">
                          · {levelName(item.workoutVariant.level.key, item.workoutVariant.level.name)}
                        </span>
                        {item.prescriptionCategory ? (
                          <Badge variant="accent">
                            {prescriptionName(item.prescriptionCategory.key, item.prescriptionCategory.name)}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <select
                      value={applyGroup[template.id] ?? ""}
                      onChange={(event) =>
                        setApplyGroup((current) => ({
                          ...current,
                          [template.id]: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-lg border border-border bg-background px-3"
                    >
                      <option value="">{t("selectGroup")}</option>
                      {workspace.groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <MobileDateField
                      value={applyWeek[template.id] ?? mondayValue()}
                      onChange={(value) =>
                        setApplyWeek((current) => ({
                          ...current,
                          [template.id]: value,
                        }))
                      }
                      planningShortcuts
                    />
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => void applyTemplate(template.id)}
                      className="sm:col-span-2"
                    >
                      {t("apply")}
                    </Button>
                  </div>
                </Card>
              ))}
              {workspace.templates.length === 0 ? (
                <Card className="p-6 text-center text-muted">
                  {t("noTemplates")}
                </Card>
              ) : null}
            </ProgressiveList>
          </section>

          <Card className="p-5">
            <button
              type="button"
              aria-expanded={createTemplateOpen}
              onClick={() => setCreateTemplateOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-xl font-bold">{t("createTemplate")}</span>
              <span aria-hidden="true">{createTemplateOpen ? "−" : "+"}</span>
            </button>
            {createTemplateOpen ? (
              <form onSubmit={createTemplate} className="mt-5 space-y-5">
                <div>
                  <p className="text-sm leading-6 text-muted">
                    {t("templateHelp")}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold">
                      {t("templateName")}
                      <input
                        required
                        maxLength={100}
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        placeholder={t("templateNamePlaceholder")}
                        className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                      />
                    </label>
                    <label className="text-sm font-semibold">
                      {t("templateDescription")}
                      <input
                        maxLength={500}
                        value={templateDescription}
                        onChange={(event) =>
                          setTemplateDescription(event.target.value)
                        }
                        placeholder={t("templateDescriptionPlaceholder")}
                        className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const workout: ProgrammingWorkout | undefined =
                      workspace.workouts.find(
                        (value) => value.id === item.workoutId,
                      );
                    return (
                      <div
                        key={index}
                        className="rounded-2xl border border-border bg-background/40 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                              {t("trainingDay", { number: index + 1 })}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {item.workoutId ? t("trainingDayReady") : t("trainingDayEmpty")}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={items.length === 1}
                            onClick={() =>
                              setItems((current) =>
                                current.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                            aria-label={t("removeItem")}
                          >
                            ×
                          </Button>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.4fr_1fr]">
                          <label className="text-sm font-semibold">
                            {t("day")}
                            <select
                              value={item.dayOffset}
                              onChange={(event) =>
                                updateItem(index, {
                                  dayOffset: Number(event.target.value),
                                })
                              }
                              className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
                            >
                              {Array.from({ length: 7 }, (_, day) => (
                                <option key={day} value={day}>
                                  {t(`days.${day}`)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <WorkoutSearchPicker
                            workouts={workspace.workouts}
                            selectedId={item.workoutId}
                            onSelect={(workoutId) => selectWorkout(index, workoutId)}
                            label={t("workout")}
                            placeholder={t("selectWorkout")}
                            searchPlaceholder={t("searchWorkouts")}
                            noResults={t("noWorkoutMatches")}
                            resultSummary={(shown, total) => t("workoutResults", { shown, total })}
                          />
                          <label className="text-sm font-semibold">
                            {t("variation")}
                            <select
                              required
                              value={item.workoutVariantId}
                              onChange={(event) =>
                                updateItem(index, {
                                  workoutVariantId: event.target.value,
                                })
                              }
                              disabled={!workout}
                              className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">{t("selectVariation")}</option>
                              {workout?.variants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                  {levelName(variant.level.key, variant.level.name)}
                                  {variant.name ? ` · ${variant.name}` : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <details className="group mt-4 rounded-xl border border-border bg-surface/60">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                            <span>{t("optionalAssignmentDetails")}</span>
                            <span aria-hidden="true" className="text-muted transition group-open:rotate-180">⌄</span>
                          </summary>
                          <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                            <label className="text-sm font-semibold">
                              {t("prescriptionCategory")}
                              <select
                                value={item.prescriptionCategoryKey}
                                onChange={(event) =>
                                  updateItem(index, {
                                    prescriptionCategoryKey: event.target.value,
                                  })
                                }
                                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
                              >
                                <option value="">{t("noPrescription")}</option>
                                {workspace.prescriptionCategories.map((category) => (
                                  <option key={category.key} value={category.key}>
                                    {prescriptionName(category.key, category.name)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-sm font-semibold">
                              {t("notes")}
                              <input
                                value={item.coachNotes}
                                maxLength={1000}
                                onChange={(event) =>
                                  updateItem(index, {
                                    coachNotes: event.target.value,
                                  })
                                }
                                placeholder={t("notesPlaceholder")}
                                className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
                              />
                            </label>
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
                <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-5 flex flex-col gap-3 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setItems((current) => [...current, emptyItem()])
                    }
                  >
                    {t("addItem")}
                  </Button>
                  <Button type="submit" isLoading={submitting} disabled={!templateReady} className="sm:ml-auto">
                    {t("saveTemplate")}
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>
        </>
      ) : null}
    </div>
  );
}
