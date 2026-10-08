Warning: truncated output (original token count: 10849)
Total output lines: 1154

"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import Button from "@/components/ui/Button";
import { useConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useRouter } from "@/i18n/navigation";
import type { BoxMember, ManagedBox } from "@/lib/boxes";
import { boxImageUrl, optimizeBoxImage } from "@/lib/box-images";

type Props = {
  initialBoxes: ManagedBox[];
  isApplicationAdmin: boolean;
  timezones: string[];
};

function message(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const value = (data as { message?: string | string[] }).message;
    return Array.isArray(value) ? value.join(", ") : value || fallback;
  }
  return fallback;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function BoxAdministration({
  initialBoxes,
  isApplicationAdmin,
  timezones,
}: Props) {
  const t = useTranslations("boxAdministration");
  const router = useRouter();
  const [boxes, setBoxes] = useState(initialBoxes);
  const [boxId, setBoxId] = useState(initialBoxes[0]?.id ?? "");
  const [members, setMembers] = useState<BoxMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(Boolean(boxId));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<"details" | "members">("details");
  const [showCreate, setShowCreate] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState<BoxMember["status"]>("ACTIVE");
  const [selectedMember, setSelectedMember] = useState<BoxMember | null>(null);
  const [assignRole, setAssignRole] = useState<BoxMember["role"]>("ATHLETE");
  const { confirm, dialog } = useConfirmationDialog();
  const selectedBox = boxes.find((box) => box.id === boxId) ?? null;
  const normalizedSearch = memberSearch.trim().toLocaleLowerCase();
  const statusMembers = members.filter((member) => member.status === memberStatus);
  const visibleMembers = normalizedSearch
    ? statusMembers.filter((member) => {
        const name =
          member.user.athleteProfile?.displayName ??
          member.user.coachProfile?.displayName ??
          "";
        return `${name} ${member.user.email} ${member.role}`
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      })
    : statusMembers;

  useEffect(() => {
    if (!boxId) return;
    const controller = new AbortController();
    void fetch(`/api/boxes/${boxId}/members`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(message(data, t("errors.load")));
        setMembers(data as BoxMember[]);
        setLoadingMembers(false);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        setError(caught instanceof Error ? caught.message : t("errors.load"));
        setLoadingMembers(false);
      });
    return () => controller.abort();
  }, [boxId, t]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function assignmentErrorMessage(response: Response, data: unknown) {
    const detail = message(data, t("errors.action"));
    if (
      response.status === 404 &&
      detail.toLocaleLowerCase().includes("user not found")
    ) {
      return t("members.userNotFound");
    }
    return detail;
  }

  async function saveBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBox) return;
    clearMessages();
    setBusy("box");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/boxes/${selectedBox.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description")),
        timezone: String(form.get("timezone")),
        location: String(form.get("location") || ""),
        address: String(form.get("address") || ""),
        latitude: optionalNumber(form.get("latitude")),
        longitude: optionalNumber(form.get("longitude")),
        supportContact: String(form.get("supportContact") || ""),
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setBoxes((current) =>
        current.map((box) =>
          box.id === selectedBox.id ? { ...box, ...data } : box,
        ),
      );
      setSuccess(t("saved"));
    } else setError(message(data, t("errors.save")));
    setBusy(null);
  }

  async function createBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setBusy("create");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/boxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        description: String(form.get("description")) || undefined,
        timezone: String(form.get("timezone")),
        location: String(form.get("location") || "") || undefined,
        address: String(form.get("address") || "") || undefined,
        latitude: optionalNumber(form.get("latitude")) ?? undefined,
        longitude: optionalNumber(form.get("longitude")) ?? undefined,
        supportContact: String(form.get("supportContact") || "") || undefined,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      const created = { ...data, _count: { memberships: 1, classes: 0 } };
      setBoxes((current) => [...current, created]);
      setBoxId(data.id as string);
      setShowCreate(false);
      setSuccess(t("created"));
    } else setError(message(data, t("errors.save")));
    setBusy(null);
  }

  async function uploadBoxImage(kind: "logo" | "cover", file: File) {
    if (!selectedBox) return;
    clearMessages();
    setBusy(`image-${kind}`);
    try {
      const optimized = await optimizeBoxImage(file, kind);
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", optimized);
      const response = await fetch(`/api/boxes/${selectedBox.id}/image`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(message(data, t("errors.save")));
      const field = kind === "logo" ? "logoPath" : "coverImagePath";
      setBoxes((current) =>
        current.map((box) =>
          box.id === selectedBox.id ? { ...box, [field]: data.path } : box,
        ),
      );
      setSuccess(t("images.saved"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.save"));
    } finally {
      setBusy(null);
    }
  }

  async function removeBoxImage(kind: "logo" | "cover") {
    if (!selectedBox) return;
    const field = kind === "logo" ? "logoPath" : "coverImagePath";
    if (!selectedBox[field]) return;

    clearMessages();
    setBusy(`image-${kind}`);
    try {
      const response = await fetch(`/api/boxes/${selectedBox.id}/image`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(message(data, t("errors.save")));
      setBoxes((current) =>
        current.map((box) =>
          box.id === selectedBox.id ? { ...box, [field]: null } : box,
        ),
      );
      setSuccess(t("images.removed"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.save"));
    } finally {
      setBusy(null);
    }
  }

  async function rotateJoinCode() {
    if (!selectedBox || !(await confirm({ description: t("joinCode.confirm") })))
      return;
    clearMessages();
    setBusy("join-code");
    const response = await fetch(`/api/boxes/${selectedBox.id}/join-code`, {
      method: "POST",
    });
    const data = await response.json();
    if (response.ok) {
      setBoxes((current) =>
        current.map((box) =>
          box.id === selectedBox.id
            ? { ...box, joinCode: data.joinCode as string }
            : box,
        ),
      );
      setSuccess(t("joinCode.rotated"));
    } else setError(message(data, t("errors.action")));
    setBusy(null);
  }

  async function copyJoinCode() {
    if (!selectedBox) return;
    try {
      await navigator.clipboard.writeText(selectedBox.joinCode);
      setSuccess(t("joinCode.copied"));
      setError(null);
    } catch {
      setError(t("joinCode.copyError"));
    }
  }

  async function assignMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBox) return;
    const formElement = event.currentTarget;
    clearMessages();
    setBusy("assign-member");
    try {
      const form = new FormData(formElement);
      const response = await fetch(`/api/boxes/${selectedBox.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email")),
          role: assignRole,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMembers((current) => {
          const assigned = data as BoxMember;
          const exists = current.some((member) => member.id === assigned.id);
          return exists
            ? current.map((member) =>
                member.id === assigned.id ? assigned : member,
              )
            : [assigned, ...current];
        });
        setSuccess(t("members.assigned"));
        formElement.reset();
        setMemberStatus("ACTIVE");
      } else setError(assignmentErrorMessage(response, data));
    } catch {
      setError(t("errors.action"));
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(member: BoxMember, role: BoxMember["role"]) {
    clearMessages();
    setBusy(member.id);
    const response = await fetch(`/api/boxes/${boxId}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await response.json();
    if (response.ok) {
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, role } : item,
        ),
      );
      setSuccess(t("members.roleSaved"));
    } else setError(message(data, t("errors.action")));
    setBusy(null);
  }

  async function changeMembershipStatus(
    member: BoxMember,
    action: "approve" | "deactivate" | "reactivate",
  ) {
    if (
      action === "deactivate" &&
      !(await confirm({ description: t("members.deactivateConfirm") }))
    )
      return;

    clearMessages();
    setBusy(member.id);
    const response = await fetch(
      `/api/boxes/${boxId}/members/${member.id}/${action}`,
      { method: "POST" },
    );
    const data = await response.json();

    if (response.ok) {
      const status =
        action === "deactivate" ? "INACTIVE" : "ACTIVE";
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                status,
                joinedAt:
                  status === "ACTIVE"
                    ? new Date().toISOString()
                    : item.joinedAt,
                leftAt:
                  status === "INACTIVE"
                    ? new Date().toISOString()
                    : nu…4849 tokens truncated…-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[80] mx-auto max-w-md sm:left-auto sm:right-6 sm:top-6 sm:mx-0"
    >
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur ${
          isError
            ? "border-red-500/40 bg-red-950/95 text-red-50"
            : "border-accent/50 bg-accent text-black"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

function MemberActionSheet({
  member,
  busy,
  canAssignOwner,
  t,
  onClose,
  onRoleChange,
  onStatusChange,
}: {
  member: BoxMember;
  busy: boolean;
  canAssignOwner: boolean;
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
  onRoleChange: (member: BoxMember, role: BoxMember["role"]) => void;
  onStatusChange: (
    member: BoxMember,
    action: "approve" | "deactivate" | "reactivate",
  ) => void;
}) {
  const name =
    member.user.athleteProfile?.displayName ??
    member.user.coachProfile?.displayName ??
    member.user.email;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/60 sm:items-center sm:justify-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="w-full rounded-t-3xl border border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-5"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
            {initials || "W"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold">{name}</h3>
            <p className="truncate text-xs text-muted">{member.user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-muted hover:bg-background"
            aria-label={t("cancel")}
          >
            ×
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-background px-3 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("members.statusLabel")}
          </span>
          <span className="text-sm font-semibold">
            {t(`members.status.${member.status.toLowerCase()}`)}
          </span>
        </div>

        {member.role === "OWNER" && !canAssignOwner ? (
          <div className="mt-4 rounded-xl bg-accent/10 px-3 py-3 text-sm font-semibold text-accent">
            {t("roles.owner")}
          </div>
        ) : (
          <>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("members.roleFor", { name })}
              </p>
              <div className="grid grid-cols-2 rounded-xl bg-background p-1">
                {(canAssignOwner
                  ? (["ATHLETE", "COACH", "OWNER"] as const)
                  : (["ATHLETE", "COACH"] as const)
                ).map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={busy}
                    onClick={() => onRoleChange(member, role)}
                    className={`min-h-11 rounded-lg text-sm font-semibold transition ${
                      member.role === role
                        ? "bg-surface text-accent shadow-sm"
                        : "text-muted"
                    }`}
                  >
                    {t(`roles.${role.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              {member.status === "PENDING" ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={() => onStatusChange(member, "approve")}
                >
                  {t("members.approve")}
                </Button>
              ) : member.status === "INACTIVE" ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={() => onStatusChange(member, "reactivate")}
                >
                  {t("members.reactivate")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  className="w-full"
                  disabled={busy}
                  onClick={() => onStatusChange(member, "deactivate")}
                >
                  {t("members.deactivate")}
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function BoxForm({
  t,
  idPrefix,
  box,
  busy,
  onSubmit,
  timezones,
}: {
  t: ReturnType<typeof useTranslations>;
  idPrefix: string;
  box?: ManagedBox;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  timezones: string[];
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <h2 className="font-bold">
        {box ? t("details.title") : t("create.title")}
      </h2>
      <div className="mt-4 space-y-5">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {t("details.sections.identity")}
          </h3>
          <Field label={t("fields.name")} htmlFor={`${idPrefix}-name`}>
            <input
              id={`${idPrefix}-name`}
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={box?.name}
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
            />
          </Field>
          <Field label={t("fields.description")} htmlFor={`${idPrefix}-description`}>
            <textarea
              id={`${idPrefix}-description`}
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={box?.description ?? ""}
              placeholder={t("fields.descriptionPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
            />
          </Field>
          <Field label={t("fields.supportContact")} htmlFor={`${idPrefix}-support-contact`}>
            <textarea
              id={`${idPrefix}-support-contact`}
              name="supportContact"
              rows={2}
              maxLength={1000}
              defaultValue={box?.supportContact ?? ""}
              placeholder={t("fields.supportContactPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
            />
          </Field>
        </div>

        <div className="space-y-3 rounded-2xl bg-background p-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {t("details.sections.location")}
          </h3>
          <Field label={t("fields.location")} htmlFor={`${idPrefix}-location`}>
            <input
              id={`${idPrefix}-location`}
              name="location"
              maxLength={120}
              defaultValue={box?.location ?? ""}
              placeholder={t("fields.locationPlaceholder")}
              className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            />
          </Field>
          <Field
            label={t("fields.address")}
            htmlFor={`${idPrefix}-address`}
            help={t("fields.addressHelp")}
          >
            <input
              id={`${idPrefix}-address`}
              name="address"
              maxLength={240}
              defaultValue={box?.address ?? box?.location ?? ""}
              placeholder={t("fields.addressPlaceholder")}
              className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("fields.latitude")} htmlFor={`${idPrefix}-latitude`}>
              <input
                id={`${idPrefix}-latitude`}
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                inputMode="decimal"
                defaultValue={box?.latitude ?? ""}
                placeholder="-25.2637"
                className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
              />
            </Field>
            <Field label={t("fields.longitude")} htmlFor={`${idPrefix}-longitude`}>
              <input
                id={`${idPrefix}-longitude`}
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                inputMode="decimal"
                defaultValue={box?.longitude ?? ""}
                placeholder="-57.5759"
                className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
              />
            </Field>
          </div>
          <p className="text-xs leading-5 text-muted">{t("fields.coordinatesHelp")}</p>
        </div>

        <div className="space-y-3">
          <Field
            label={t("fields.timezone")}
            htmlFor={`${idPrefix}-timezone`}
            help={t("fields.timezoneHelp")}
          >
            <select
              id={`${idPrefix}-timezone`}
              name="timezone"
              required
              defaultValue={box?.timezone ?? "UTC"}
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
            >
              {!timezones.includes(box?.timezone ?? "UTC") ? (
                <option value={box?.timezone}>{box?.timezone}</option>
              ) : null}
              {!timezones.includes("UTC") ? <option value="UTC">UTC</option> : null}
              {timezones.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Button disabled={busy} className="mt-4 w-full">
        {busy ? t("working") : box ? t("details.save") : t("create.submit")}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {help ? <p className="mt-1.5 text-xs leading-5 text-muted">{help}</p> : null}
    </div>
  );
}

function SummaryMetric({
  value,
  label,
  small = false,
}: {
  value: string | number;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-background px-2 py-3 text-center">
      <p
        className={`${small ? "truncate text-xs" : "text-lg"} font-bold tabular-nums`}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}