"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressiveList from "@/components/ui/ProgressiveList";
import type {
  CoachProgrammingWorkspace as Workspace,
  ProgrammingWorkout,
} from "@/lib/coach-programming";

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

export default function CoachProgrammingWorkspace() {
  const t = useTranslations("coachProgramming");
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
    }
  }

  async function deleteGroup(id: string, name: string) {
    if (!window.confirm(t("deleteGroupConfirm", { name }))) return;
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
    }
  }

  async function deleteTemplate(id: string, name: string) {
    if (!window.confirm(t("deleteTemplateConfirm", { name }))) return;
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
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

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
          <h2 className="text-lg font-bold">{t("createGroup")}</h2>
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
        </Card>
      </section>

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
                    <span className="font-semibold">{item.workout.name}</span>
                    <span className="text-muted">
                      · {item.workoutVariant.level.name}
                    </span>
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
                <input
                  type="date"
                  value={applyWeek[template.id] ?? mondayValue()}
                  onChange={(event) =>
                    setApplyWeek((current) => ({
                      ...current,
                      [template.id]: event.target.value,
                    }))
                  }
                  className="min-h-11 rounded-lg border border-border bg-background px-3"
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
        <h2 className="text-xl font-bold">{t("createTemplate")}</h2>
        <form onSubmit={createTemplate} className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              aria-label={t("templateName")}
              required
              maxLength={100}
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder={t("templateName")}
              className="min-h-12 rounded-lg border border-border bg-background px-3"
            />
            <input
              aria-label={t("templateDescription")}
              maxLength={500}
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
              placeholder={t("templateDescription")}
              className="min-h-12 rounded-lg border border-border bg-background px-3"
            />
          </div>
          <div className="space-y-4">
            {items.map((item, index) => {
              const workout: ProgrammingWorkout | undefined =
                workspace.workouts.find((value) => value.id === item.workoutId);
              return (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-2 lg:grid-cols-5"
                >
                  <select
                    value={item.dayOffset}
                    onChange={(event) =>
                      updateItem(index, {
                        dayOffset: Number(event.target.value),
                      })
                    }
                    className="min-h-11 rounded-lg border border-border bg-background px-3"
                  >
                    {Array.from({ length: 7 }, (_, day) => (
                      <option key={day} value={day}>
                        {t(`days.${day}`)}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={item.workoutId}
                    onChange={(event) =>
                      selectWorkout(index, event.target.value)
                    }
                    className="min-h-11 rounded-lg border border-border bg-background px-3"
                  >
                    <option value="">{t("selectWorkout")}</option>
                    {workspace.workouts.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={item.workoutVariantId}
                    onChange={(event) =>
                      updateItem(index, {
                        workoutVariantId: event.target.value,
                      })
                    }
                    className="min-h-11 rounded-lg border border-border bg-background px-3"
                  >
                    <option value="">{t("selectVariation")}</option>
                    {workout?.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.level.name}
                        {variant.name ? ` · ${variant.name}` : ""}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.prescriptionCategoryKey}
                    onChange={(event) =>
                      updateItem(index, {
                        prescriptionCategoryKey: event.target.value,
                      })
                    }
                    className="min-h-11 rounded-lg border border-border bg-background px-3"
                  >
                    <option value="">{t("noPrescription")}</option>
                    {workspace.prescriptionCategories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      value={item.coachNotes}
                      maxLength={1000}
                      onChange={(event) =>
                        updateItem(index, { coachNotes: event.target.value })
                      }
                      placeholder={t("notes")}
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      aria-label={t("removeItem")}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setItems((current) => [...current, emptyItem()])}
            >
              {t("addItem")}
            </Button>
            <Button type="submit" isLoading={submitting}>
              {t("saveTemplate")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
