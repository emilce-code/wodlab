"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import BoxLogo from "@/components/ui/BoxLogo";
import BoxLocationMap from "@/components/ui/BoxLocationMap";
import BoxDetailsIcon from "@/components/ui/BoxDetailsIcon";
import { useRouter } from "@/i18n/navigation";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { optimizeBoxImage } from "@/lib/box-images";
import {
  boxDestination,
  contactChannels,
  contactHref,
} from "@/lib/box-details";
import type { ManagedBox } from "@/lib/boxes";

function initialValues(box: ManagedBox) {
  return {
    name: box.name,
    description: box.description ?? "",
    location: box.location ?? "",
    address: box.address ?? "",
    latitude: box.latitude?.toString() ?? "",
    longitude: box.longitude?.toString() ?? "",
    timezone: box.timezone,
    whatsapp: box.whatsapp ?? "",
    phone: box.phone ?? "",
    email: box.email ?? "",
    instagram: box.instagram ?? "",
    website: box.website ?? "",
  };
}
type Values = ReturnType<typeof initialValues>;

export default function BoxDetailsEditor({
  initialBox,
}: {
  initialBox: ManagedBox;
}) {
  const t = useTranslations("boxDetailsV4");
  const router = useRouter();
  const { boxes, replaceBoxes } = useActiveBox();
  const [box, setBox] = useState(initialBox);
  const [values, setValues] = useState(() => initialValues(initialBox));
  const [baseline, setBaseline] = useState(() => initialValues(initialBox));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(
    {},
  );
  const [busy, setBusy] = useState<"save" | "logo" | null>(null);
  const pending = useRef(false);
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const location = boxDestination({
    latitude: values.latitude.trim() ? Number(values.latitude) : null,
    longitude: values.longitude.trim() ? Number(values.longitude) : null,
    address: values.address,
    location: values.location,
  });
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warning = t("unsaved");
    function unload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function navigate(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && !window.confirm(warning)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    const navigation = (window as unknown as { navigation?: EventTarget })
      .navigation;
    function traverse(event: Event) {
      if (
        (event as Event & { navigationType?: string }).navigationType ===
          "traverse" &&
        event.cancelable &&
        !window.confirm(warning)
      )
        event.preventDefault();
    }
    navigation?.addEventListener("navigate", traverse);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      navigation?.removeEventListener("navigate", traverse);
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy, t]);

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }
  function sync(saved: ManagedBox) {
    setBox((current) => ({ ...current, ...saved }));
    replaceBoxes(
      boxes.map((item) => (item.id === box.id ? { ...item, ...saved } : item)),
    );
    router.refresh();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors: Partial<Record<keyof Values, string>> = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 80)
      nextErrors.name = t("invalidName");
    for (const field of contactChannels)
      if (values[field].trim() && !contactHref(field, values[field]))
        nextErrors[field] = t("invalidContact");
    for (const field of ["latitude", "longitude"] as const) {
      const value = values[field].trim();
      if (
        value &&
        (!Number.isFinite(Number(value)) ||
          Math.abs(Number(value)) > (field === "latitude" ? 90 : 180))
      )
        nextErrors[field] = t("invalidCoordinates");
    }
    if (Boolean(values.latitude.trim()) !== Boolean(values.longitude.trim())) {
      nextErrors.latitude = t("coordinatePair");
      nextErrors.longitude = t("coordinatePair");
    }
    if (values.timezone.trim()) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: values.timezone.trim() });
      } catch {
        nextErrors.timezone = t("invalidTimezone");
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      form.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)
        ?.focus();
      return;
    }
    pending.current = true;
    setBusy("save");
    setFeedback(null);
    try {
      const response = await fetch(`/api/boxes/${encodeURIComponent(box.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          name: values.name.trim(),
          timezone: values.timezone.trim() || "UTC",
          latitude: values.latitude.trim() ? Number(values.latitude) : null,
          longitude: values.longitude.trim() ? Number(values.longitude) : null,
          ...Object.fromEntries(
            contactChannels.map((channel) => [
              channel,
              values[channel]
                .trim()
                .replace(
                  channel === "phone" || channel === "whatsapp"
                    ? /[\s()-]/g
                    : /$^/,
                  "",
                ) || null,
            ]),
          ),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(t("saveError"));
      const saved = { ...box, ...data } as ManagedBox;
      setValues(initialValues(saved));
      setBaseline(initialValues(saved));
      sync(saved);
      setFeedback({ error: false, text: t("saved") });
    } catch {
      setFeedback({ error: true, text: t("saveError") });
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  async function logo(file: File | null) {
    if (pending.current) return;
    pending.current = true;
    setBusy("logo");
    setFeedback(null);
    try {
      let body: FormData | string;
      if (file) {
        const optimized = await optimizeBoxImage(file, "logo");
        const data = new FormData();
        data.set("kind", "logo");
        data.set("file", optimized);
        body = data;
      } else body = JSON.stringify({ kind: "logo" });
      const response = await fetch(
        `/api/boxes/${encodeURIComponent(box.id)}/image`,
        {
          method: file ? "POST" : "DELETE",
          headers: file ? undefined : { "Content-Type": "application/json" },
          body,
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(t("logoError"));
      sync({ ...box, logoPath: data.path });
      setFeedback({ error: false, text: t("logoSaved") });
    } catch {
      setFeedback({ error: true, text: t("logoError") });
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }
  function field(
    name: keyof Values,
    options: { type?: string; maxLength?: number; multiline?: boolean } = {},
  ) {
    const props = {
      id: `box-${name}`,
      name,
      value: values[name],
      disabled: busy !== null,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => update(name, event.target.value),
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `error-${name}` : undefined,
      maxLength: options.maxLength,
      className:
        "mt-1 min-h-11 w-full rounded-xl border border-border/60 bg-surface px-3 py-2 text-base transition-colors duration-200 hover:border-muted/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400 motion-reduce:transition-none",
    };
    return (
      <div key={name}>
        <label htmlFor={props.id} className="text-sm text-muted">
          {t(`fields.${name}`)}
          {name === "name" ? " *" : ""}
        </label>
        {options.multiline ? (
          <textarea {...props} rows={name === "address" ? 2 : 3} />
        ) : (
          <input
            {...props}
            type={options.type ?? "text"}
            required={name === "name"}
            inputMode={
              name === "latitude" || name === "longitude"
                ? "decimal"
                : undefined
            }
          />
        )}
        {errors[name] ? (
          <p id={`error-${name}`} className="mt-1 text-sm text-red-300">
            {errors[name]}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl pb-6">
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2">
          <button
            type="button"
            aria-label={t("cancel")}
            disabled={busy !== null}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground active:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
            onClick={() => {
              if (!dirty || window.confirm(t("unsaved")))
                router.push(`/boxes/${box.id}`);
            }}
          >
            <BoxDetailsIcon name="back" />
          </button>
          <h1 className="text-center text-sm font-semibold">{t("edit")}</h1>
          <Button
            type="submit"
            form="box-details-form"
            aria-label={busy === "save" ? t("working") : t("save")}
            aria-busy={busy === "save"}
            disabled={busy !== null || !dirty}
            className="rounded-xl px-3 duration-200 active:bg-accent-strong motion-reduce:transition-none"
          >
            {busy === "save" ? t("working") : t("saveShort")}
          </Button>
        </div>
        {feedback ? (
          <p
            role={feedback.error ? "alert" : "status"}
            className={`mt-2 text-sm ${feedback.error ? "text-red-300" : "text-accent"}`}
          >
            {feedback.text}
          </p>
        ) : null}
      </header>
      <form
        id="box-details-form"
        ref={form}
        noValidate
        onSubmit={save}
        className="space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0"
      >
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="logo-title" className="space-y-3">
            <h2
              id="logo-title"
              className="text-sm font-semibold tracking-tight"
            >
              {t("logo")}
            </h2>
            <div className="flex items-center gap-3">
              <BoxLogo name={values.name || box.name} path={box.logoPath} />
              <input
                ref={fileInput}
                id="box-logo"
                type="file"
                accept="image/*"
                aria-label={t(box.logoPath ? "changeLogo" : "uploadLogo")}
                disabled={busy !== null}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void logo(file);
                  event.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                className="flex-1 rounded-xl border-border/60 duration-200 active:bg-surface-elevated motion-reduce:transition-none"
                onClick={() => fileInput.current?.click()}
              >
                {t(box.logoPath ? "changeLogo" : "uploadLogo")}
              </Button>
              {box.logoPath ? (
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={t("removeLogo")}
                  disabled={busy !== null}
                  className="shrink-0 rounded-xl border-border/60 px-3 text-red-400 duration-200 hover:bg-red-500/10 active:bg-red-500/10 motion-reduce:transition-none"
                  onClick={() => void logo(null)}
                >
                  <BoxDetailsIcon name="trash" />
                </Button>
              ) : null}
            </div>
            {busy === "logo" ? (
              <p role="status" className="text-sm">
                {t("working")}
              </p>
            ) : null}
            <p className="text-xs text-muted">{t("logoImmediate")}</p>
          </section>
          <section aria-labelledby="basic-title" className="space-y-3">
            <h2
              id="basic-title"
              className="text-sm font-semibold tracking-tight"
            >
              {t("basic")}
            </h2>
            {field("name", { maxLength: 80 })}
            {box.organization ? (
              <div className="space-y-1">
                <p className="text-sm text-muted">{t("organization")}</p>
                <p className="break-words rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm">
                  {box.organization.name}
                </p>
                <p className="flex items-start gap-2 text-xs text-muted">
                  <BoxDetailsIcon name="info" className="h-4 w-4 shrink-0" />
                  {t("organizationReadOnly")}
                </p>
              </div>
            ) : null}
            {field("description", { maxLength: 500, multiline: true })}
          </section>
        </div>
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="location-title" className="space-y-3">
            <h2
              id="location-title"
              className="text-sm font-semibold tracking-tight"
            >
              {t("locationTitle")}
            </h2>
            {location.coordinates ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <BoxLocationMap
                  name={values.name || box.name}
                  destination={location.destination!}
                  thumbnail
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl border-border/60 duration-200 active:bg-surface-elevated motion-reduce:transition-none"
                  disabled={busy !== null}
                  onClick={() =>
                    document.getElementById("box-address")?.focus()
                  }
                >
                  {t("changeLocation")}
                </Button>
              </div>
            ) : null}
            {field("location", { maxLength: 120 })}
            {field("address", { maxLength: 240, multiline: true })}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field("latitude")}
              {field("longitude")}
            </div>
            {field("timezone", { maxLength: 80 })}
          </section>
        </div>
        <section
          aria-labelledby="contact-title"
          className="space-y-3 md:col-span-2"
        >
          <h2
            id="contact-title"
            className="text-sm font-semibold tracking-tight"
          >
            {t("contactTitle")}
          </h2>
          <p className="text-sm text-muted">{t("contactHelp")}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contactChannels.map((channel) => (
              <div
                key={channel}
                className={
                  channel === "website"
                    ? "sm:col-span-2 sm:max-w-xl"
                    : undefined
                }
              >
                {field(channel, {
                  type:
                    channel === "email"
                      ? "email"
                      : channel === "website"
                        ? "url"
                        : channel === "phone" || channel === "whatsapp"
                          ? "tel"
                          : "text",
                  maxLength: 254,
                })}
              </div>
            ))}
          </div>
          {box.supportContact ? (
            <div className="text-sm text-muted">
              <p className="font-semibold">{t("legacyContact")}</p>
              <p className="mt-2 whitespace-pre-line break-words">
                {box.supportContact}
              </p>
            </div>
          ) : null}
        </section>
      </form>
    </div>
  );
}
