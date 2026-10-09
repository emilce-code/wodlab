"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import BoxLogo from "@/components/ui/BoxLogo";
import { useRouter } from "@/i18n/navigation";
import { useActiveBox } from "@/components/layout/ActiveBoxContext";
import { optimizeBoxImage } from "@/lib/box-images";
import { contactChannels, contactHref } from "@/lib/box-details";
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
        "mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base",
    };
    return (
      <div key={name}>
        <label htmlFor={props.id} className="text-sm font-semibold">
          {t(`fields.${name}`)}
          {name === "name" ? " *" : ""}
        </label>
        {options.multiline ? (
          <textarea {...props} rows={3} />
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
    <div className="mx-auto max-w-xl py-6">
      <header className="mb-8">
        <button
          type="button"
          disabled={busy !== null}
          className="min-h-11 text-sm font-bold text-accent"
          onClick={() => {
            if (!dirty || window.confirm(t("unsaved")))
              router.push(`/boxes/${box.id}`);
          }}
        >
          ← {t("cancel")}
        </button>
        <h1 className="mt-2 text-2xl font-black">{t("edit")}</h1>
      </header>
      <form ref={form} noValidate onSubmit={save} className="space-y-8">
        <section aria-labelledby="logo-title" className="space-y-4">
          <h2 id="logo-title" className="font-bold">
            {t("logo")}
          </h2>
          <BoxLogo name={values.name || box.name} path={box.logoPath} />
          <label
            htmlFor="box-logo"
            className="block text-sm font-semibold text-accent"
          >
            {t(box.logoPath ? "changeLogo" : "uploadLogo")}
          </label>
          <input
            id="box-logo"
            type="file"
            accept="image/*"
            disabled={busy !== null}
            className="min-h-11 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-surface-elevated file:px-3 file:py-3 file:text-accent"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void logo(file);
              event.currentTarget.value = "";
            }}
          />
          {box.logoPath ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void logo(null)}
            >
              {t("removeLogo")}
            </Button>
          ) : null}
          {busy === "logo" ? <p role="status">{t("working")}</p> : null}
          <p className="text-xs text-muted">{t("logoImmediate")}</p>
        </section>
        <section aria-labelledby="basic-title" className="space-y-4">
          <h2 id="basic-title" className="font-bold">
            {t("basic")}
          </h2>
          {field("name", { maxLength: 80 })}
          {field("description", { maxLength: 500, multiline: true })}
          {box.organization ? (
            <p className="text-sm text-muted">
              {t("organization")}: {box.organization.name}
            </p>
          ) : null}
        </section>
        <section aria-labelledby="location-title" className="space-y-4">
          <h2 id="location-title" className="font-bold">
            {t("locationTitle")}
          </h2>
          {field("location", { maxLength: 120 })}
          {field("address", { maxLength: 240, multiline: true })}
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
            {field("latitude")}
            {field("longitude")}
          </div>
          {field("timezone", { maxLength: 80 })}
        </section>
        <section aria-labelledby="contact-title" className="space-y-4">
          <h2 id="contact-title" className="font-bold">
            {t("contactTitle")}
          </h2>
          <p className="text-sm text-muted">{t("contactHelp")}</p>
          {contactChannels.map((channel) =>
            field(channel, {
              type:
                channel === "email"
                  ? "email"
                  : channel === "website"
                    ? "url"
                    : channel === "phone" || channel === "whatsapp"
                      ? "tel"
                      : "text",
              maxLength: 254,
            }),
          )}
          {box.supportContact ? (
            <div className="text-sm text-muted">
              <p className="font-semibold">{t("legacyContact")}</p>
              <p className="mt-2 whitespace-pre-line break-words">
                {box.supportContact}
              </p>
            </div>
          ) : null}
        </section>
        <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          {feedback ? (
            <p
              role={feedback.error ? "alert" : "status"}
              className={`mb-3 text-sm ${feedback.error ? "text-red-300" : "text-accent"}`}
            >
              {feedback.text}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={busy !== null || !dirty}
          >
            {busy === "save" ? t("working") : t("save")}
          </Button>
        </footer>
      </form>
    </div>
  );
}
