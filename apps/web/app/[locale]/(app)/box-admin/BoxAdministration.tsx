"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import Alert from "@/components/ui/Alert";
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
  const [assignRole, setAssignRole] = useState<BoxMember["role"]>("COACH");
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
      } else setError(message(data, t("errors.action")));
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
                    : null,
              }
            : item,
        ),
      );
      setSuccess(t(`members.${action}d`));
    } else {
      setError(message(data, t("errors.action")));
    }
    setBusy(null);
  }

  return (
    <div className="mt-6 space-y-4">
      {dialog}
      <div className="sticky top-2 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
        <label
          htmlFor="managed-box"
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {t("selectBox")}
        </label>
        <div className="mt-2 flex gap-2">
          <select
            id="managed-box"
            value={boxId}
            onChange={(event) => {
              setLoadingMembers(true);
              setBoxId(event.target.value);
            }}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-base"
          >
            {boxes.map((box) => (
              <option key={box.id} value={box.id}>
                {box.name}
              </option>
            ))}
          </select>
          {isApplicationAdmin ? (
            <Button
              type="button"
              onClick={() => setShowCreate((value) => !value)}
            >
              {showCreate ? t("cancel") : t("create.open")}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      {showCreate ? (
        <BoxForm
          t={t}
          idPrefix="create"
          busy={busy === "create"}
          onSubmit={createBox}
          timezones={timezones}
        />
      ) : null}

      {selectedBox ? (
        <>
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {t("summary.eyebrow")}
                </p>
                <h2 className="mt-1 truncate text-xl font-bold">
                  {selectedBox.name}
                </h2>
                {selectedBox.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {selectedBox.description}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {isApplicationAdmin ? t("summary.admin") : t("summary.owner")}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <SummaryMetric
                value={selectedBox._count.memberships}
                label={t("summary.members")}
              />
              <SummaryMetric
                value={selectedBox._count.classes ?? 0}
                label={t("summary.classes")}
              />
              <SummaryMetric
                value={
                  selectedBox.timezone
                    .split("/")
                    .at(-1)
                    ?.replaceAll("_", " ") ?? "UTC"
                }
                label={t("summary.timezone")}
                small
              />
            </div>
          </section>

          <div
            role="tablist"
            aria-label={t("tabs.label")}
            className="grid grid-cols-2 rounded-xl bg-surface-elevated p-1"
          >
            {(["details", "members"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${tab === item ? "bg-surface text-accent shadow-sm" : "text-muted"}`}
              >
                {t(`tabs.${item}`)}
              </button>
            ))}
          </div>

          {tab === "details" ? (
            <div className="space-y-4">
              <section className="overflow-hidden rounded-3xl border border-border bg-surface">
                <div className="px-4 pb-3 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    {t("images.eyebrow")}
                  </p>
                  <h2 className="mt-1 text-lg font-black">{t("images.title")}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted">{t("images.description")}</p>
                </div>
                <label className="group relative block h-36 cursor-pointer overflow-hidden bg-background sm:h-44">
                  {boxImageUrl(selectedBox.coverImagePath) ? (
                    <Image
                      src={boxImageUrl(selectedBox.coverImagePath)!}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 768px"
                      className="object-cover opacity-70 transition group-active:opacity-50"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,255,18,0.24),transparent_45%),linear-gradient(135deg,rgba(163,255,18,0.12),rgba(255,255,255,0.03)_38%,rgba(0,0,0,0)_70%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                    {busy === "image-cover" ? t("working") : t("images.changeCover")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy?.startsWith("image-") ?? false}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadBoxImage("cover", file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <div className="relative px-4 pb-4">
                  {selectedBox.coverImagePath ? (
                    <button
                      type="button"
                      disabled={busy?.startsWith("image-") ?? false}
                      onClick={() => void removeBoxImage("cover")}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:opacity-50"
                    >
                      {t("images.removeCover")}
                    </button>
                  ) : null}
                  <label className="-mt-8 inline-flex cursor-pointer flex-col items-center">
                    <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-accent text-2xl font-black text-accent-foreground shadow-lg">
                      {boxImageUrl(selectedBox.logoPath) ? (
                        <Image
                          src={boxImageUrl(selectedBox.logoPath)!}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_35%),linear-gradient(135deg,#a3ff12,#6bd600)] text-2xl font-black text-black">
                          {selectedBox.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 text-xs font-bold text-accent">
                      {busy === "image-logo" ? t("working") : t("images.changeLogo")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={busy?.startsWith("image-") ?? false}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadBoxImage("logo", file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {selectedBox.logoPath ? (
                    <button
                      type="button"
                      disabled={busy?.startsWith("image-") ?? false}
                      onClick={() => void removeBoxImage("logo")}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-black text-red-300 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:opacity-50 sm:w-auto"
                    >
                      {t("images.removeLogo")}
                    </button>
                  ) : null}
                  <p className="mt-3 text-xs leading-5 text-muted">{t("images.help")}</p>
                </div>
              </section>

              <BoxForm
                t={t}
                idPrefix="edit"
                box={selectedBox}
                busy={busy === "box"}
                onSubmit={saveBox}
                timezones={timezones}
              />
              <section className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="font-bold">{t("joinCode.title")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t("joinCode.description")}
                </p>
                <div className="mt-4 rounded-xl bg-background p-4 text-center font-mono text-2xl font-bold tracking-[0.2em] text-accent">
                  {selectedBox.joinCode}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyJoinCode()}
                  >
                    {t("joinCode.copy")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy === "join-code"}
                    onClick={() => void rotateJoinCode()}
                  >
                    {busy === "join-code" ? t("working") : t("joinCode.rotate")}
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-2xl border border-border bg-surface p-4">
              <div>
                <h2 className="font-bold">{t("members.title")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t("members.description", { count: members.length })}
                </p>
              </div>
              <form
                onSubmit={assignMember}
                className="mt-4 rounded-2xl border border-border bg-background p-3"
              >
                <label htmlFor="assign-member-email" className="text-sm font-bold">
                  {t("members.assignTitle")}
                </label>
                <input
                  id="assign-member-email"
                  name="email"
                  type="email"
                  required
                  placeholder={t("members.assignEmailPlaceholder")}
                  className="mt-3 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(isApplicationAdmin
                    ? (["OWNER", "COACH"] as const)
                    : (["COACH", "ATHLETE"] as const)
                  ).map((role) => (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={assignRole === role}
                      onClick={() => setAssignRole(role)}
                      className={`min-h-11 rounded-xl text-sm font-black transition ${
                        assignRole === role
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {t(`roles.${role.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
                <Button
                  className="mt-3 w-full"
                  disabled={busy === "assign-member"}
                >
                  {busy === "assign-member"
                    ? t("working")
                    : t("members.assign")}
                </Button>
              </form>
              <div
                className="mt-4 grid grid-cols-3 rounded-xl bg-background p-1"
                role="tablist"
                aria-label={t("members.statusLabel")}
              >
                {(["ACTIVE", "PENDING", "INACTIVE"] as const).map((status) => {
                  const count = members.filter((member) => member.status === status).length;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={memberStatus === status}
                      onClick={() => setMemberStatus(status)}
                      className={`relative min-h-11 rounded-lg px-1 text-xs font-semibold transition sm:text-sm ${
                        memberStatus === status
                          ? "bg-surface text-accent shadow-sm"
                          : "text-muted"
                      }`}
                    >
                      <span>{t(`members.status.${status.toLowerCase()}`)}</span>
                      <span className="ml-1 tabular-nums">{count}</span>
                      {status === "PENDING" && count > 0 && memberStatus !== status ? (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <label htmlFor="member-search" className="sr-only">
                {t("members.searchLabel")}
              </label>
              <input
                id="member-search"
                type="search"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder={t("members.searchPlaceholder")}
                className="mt-4 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
              />
              {loadingMembers ? (
                <p className="mt-4 text-sm text-muted">{t("loading")}</p>
              ) : null}
              <div className="mt-3 divide-y divide-border">
                {visibleMembers.map((member) => {
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
                    <article key={member.id} className="flex min-h-[72px] items-center gap-3 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {initials || "W"}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {t(`roles.${member.role.toLowerCase()}`)}
                          {member.status === "PENDING" ? ` · ${t("members.status.pending")}` : ""}
                        </p>
                      </button>
                      {member.status === "PENDING" && member.role !== "OWNER" ? (
                        <Button
                          type="button"
                          disabled={busy === member.id}
                          onClick={() => void changeMembershipStatus(member, "approve")}
                        >
                          {t("members.approve")}
                        </Button>
                      ) : (
                        <button
                          type="button"
                          aria-label={t("members.roleFor", { name })}
                          onClick={() => setSelectedMember(member)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold text-muted hover:bg-background hover:text-foreground"
                        >
                          ···
                        </button>
                      )}
                    </article>
                  );
                })}
                {!loadingMembers && visibleMembers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">
                    {t("members.empty")}
                  </p>
                ) : null}
              </div>
            </section>
          )}
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {t("empty")}
        </p>
      )}

      {selectedMember ? (
        <MemberActionSheet
          member={members.find((item) => item.id === selectedMember.id) ?? selectedMember}
          busy={busy === selectedMember.id}
          canAssignOwner={isApplicationAdmin}
          t={t}
          onClose={() => setSelectedMember(null)}
          onRoleChange={(member, role) => void changeRole(member, role)}
          onStatusChange={(member, action) =>
            void changeMembershipStatus(member, action)
          }
        />
      ) : null}
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
      <div className="mt-4 space-y-3">
        <label
          htmlFor={`${idPrefix}-name`}
          className="block text-sm font-semibold"
        >
          {t("fields.name")}
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={box?.name}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
        />
        <label
          htmlFor={`${idPrefix}-description`}
          className="block text-sm font-semibold"
        >
          {t("fields.description")}
        </label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={box?.description ?? ""}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
        />
        <label htmlFor={`${idPrefix}-location`} className="block text-sm font-semibold">
          {t("fields.location")}
        </label>
        <input
          id={`${idPrefix}-location`}
          name="location"
          maxLength={120}
          defaultValue={box?.location ?? ""}
          placeholder={t("fields.locationPlaceholder")}
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base"
        />
        <label
          htmlFor={`${idPrefix}-timezone`}
          className="block text-sm font-semibold"
        >
          {t("fields.timezone")}
        </label>
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
        <p className="text-xs text-muted">{t("fields.timezoneHelp")}</p>
      </div>
      <Button disabled={busy} className="mt-4 w-full">
        {busy ? t("working") : box ? t("details.save") : t("create.submit")}
      </Button>
    </form>
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
