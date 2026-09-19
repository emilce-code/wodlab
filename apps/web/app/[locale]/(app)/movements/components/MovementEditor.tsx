"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import type { Movement } from "./MovementCard";

type Option = { key: string; name: string };

type Props = {
  categories: Option[];
  measurementTypes: Option[];
  movement?: Movement;
};

function responseMessage(data: unknown, fallback: string) {
  if (typeof data !== "object" || data === null || !("message" in data))
    return fallback;
  const message = data.message;
  return Array.isArray(message)
    ? message.join(", ")
    : String(message || fallback);
}

export default function MovementEditor({
  categories,
  measurementTypes,
  movement,
}: Props) {
  const t = useTranslations("movements.management");
  const locale = useLocale();
  const categoryT = useTranslations("movementCategories");
  const measurementT = useTranslations("measurementTypes");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(
    () =>
      Boolean(movement) &&
      Boolean(
        movement?.aliases.length ||
        movement?.description ||
        movement?.videoUrl ||
        movement?.isFoundational,
      ),
  );
  const [name, setName] = useState(movement?.name ?? "");
  const [categoryKey, setCategoryKey] = useState(
    movement?.category.key ?? categories[0]?.key ?? "",
  );
  const [selectedTypes, setSelectedTypes] = useState(
    () => movement?.measurementTypes.map((item) => item.key) ?? [],
  );
  const [aliases, setAliases] = useState(movement?.aliases.join(", ") ?? "");
  const [description, setDescription] = useState(movement?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(movement?.videoUrl ?? "");
  const [isFoundational, setIsFoundational] = useState(
    movement?.isFoundational ?? false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedCategoryKey = categoryKey.toLowerCase();
  const categoryHelpKey = [
    "weightlifting",
    "gymnastics",
    "monostructural",
  ].includes(normalizedCategoryKey)
    ? normalizedCategoryKey
    : "other";

  function getCategoryName(category: Option) {
    const key = category.key.toLowerCase();
    return categoryT.has(key) ? categoryT(key) : category.name;
  }

  function toggleType(key: string) {
    setSelectedTypes((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !categoryKey || selectedTypes.length === 0) {
      setError(t("required"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        movement ? `/api/movements/${movement.id}` : "/api/movements",
        {
          method: movement ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
          },
          body: JSON.stringify({
            name: name.trim(),
            categoryKey,
            measurementTypeKeys: selectedTypes,
            aliases: aliases
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            description: description.trim(),
            videoUrl: videoUrl.trim(),
            isFoundational,
          }),
        },
      );
      const data = (await response.json()) as unknown;
      if (!response.ok) throw new Error(responseMessage(data, t("saveError")));
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMovement() {
    if (!movement) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/movements/${movement.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as unknown;
      if (!response.ok)
        throw new Error(responseMessage(data, t("deleteError")));
      router.push("/movements");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setError(null);
        }}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <span>
          <span className="block font-bold">
            {movement ? t("editTitle") : t("createTitle")}
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {movement ? t("editDescription") : t("createDescription")}
          </span>
        </span>
        <span aria-hidden="true" className="text-xl text-muted">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <form
          onSubmit={submit}
          className="space-y-5 border-t border-border p-4 sm:p-5"
        >
          <div>
            <p className="font-bold">{t("essentialsTitle")}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t("essentialsDescription")}
            </p>
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              {t("name")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                required
                autoComplete="off"
                placeholder={t("namePlaceholder")}
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("category")}
              <select
                value={categoryKey}
                onChange={(event) => setCategoryKey(event.target.value)}
                required
                aria-describedby="movement-category-help"
                className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
              >
                {categories.map((item) => (
                  <option key={item.key} value={item.key}>
                    {getCategoryName(item)}
                  </option>
                ))}
              </select>
              <span
                id="movement-category-help"
                className="mt-2 block text-xs font-normal leading-5 text-muted"
              >
                {t(`categoryHelp.${categoryHelpKey}`)}
              </span>
            </label>
          </div>

          <fieldset className="rounded-xl border border-border bg-background/60 p-4">
            <legend className="text-sm font-semibold">
              {t("measurementTypes")}
            </legend>
            <p className="mt-1 text-xs leading-5 text-muted">
              {t("measurementTypesHelp")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {measurementTypes.map((item) => {
                const selected = selectedTypes.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleType(item.key)}
                    className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${selected ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}
                  >
                    {measurementT(item.key.toLowerCase())}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <section className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setOptionalOpen((current) => !current)}
              aria-expanded={optionalOpen}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span>
                <span className="block font-semibold">
                  {t("optionalTitle")}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">
                  {t("optionalDescription")}
                </span>
              </span>
              <span aria-hidden="true" className="text-xl text-muted">
                {optionalOpen ? "−" : "+"}
              </span>
            </button>

            {optionalOpen ? (
              <div className="space-y-5 border-t border-border p-4">
                <label className="block text-sm font-semibold">
                  {t("aliases")}
                  <input
                    value={aliases}
                    onChange={(event) => setAliases(event.target.value)}
                    placeholder={t("aliasesPlaceholder")}
                    className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
                  />
                  <span className="mt-1.5 block text-xs font-normal leading-5 text-muted">
                    {t("aliasesHelp")}
                  </span>
                </label>
                <label className="block text-sm font-semibold">
                  {t("description")}
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder={t("descriptionPlaceholder")}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  {t("videoUrl")}
                  <input
                    type="url"
                    inputMode="url"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3"
                  />
                </label>
                <div>
                  <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={isFoundational}
                      onChange={(event) =>
                        setIsFoundational(event.target.checked)
                      }
                      aria-describedby="foundational-movement-help"
                      className="h-5 w-5 accent-accent"
                    />
                    {t("foundational")}
                  </label>
                  <p
                    id="foundational-movement-help"
                    className="ml-8 text-xs leading-5 text-muted"
                  >
                    {t("foundationalHelp")}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 -mx-2 flex flex-col gap-2 rounded-2xl border border-border bg-surface px-3 py-3 shadow-2xl shadow-black/25 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" isLoading={submitting}>
              {movement ? t("saveChanges") : t("create")}
            </Button>
          </div>

          {movement?.canDelete ? (
            <div className="border-t border-border pt-5">
              {confirmDelete ? (
                <div className="space-y-3 rounded-lg border border-red-500/30 p-4">
                  <p className="text-sm font-semibold">{t("deleteConfirm")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="danger"
                      isLoading={deleting}
                      onClick={deleteMovement}
                    >
                      {t("delete")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmDelete(false)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("delete")}
                </Button>
              )}
            </div>
          ) : null}
        </form>
      ) : null}
    </Card>
  );
}
