"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { AdminUsersResponse } from "@/lib/admin";
import type { UserRole } from "@/lib/auth";

const PAGE_SIZE = 12;
const roles: UserRole[] = ["USER", "COACH", "ADMIN"];

type Props = { currentUserId: string };

export default function UserRoleManager({ currentUserId }: Props) {
  const t = useTranslations("adminUsers");
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (role) params.set("role", role);

    try {
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error();
      setData((await response.json()) as AdminUsersResponse);
    } catch {
      setError(t("loadError"));
    }
  }, [page, role, search, t]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (role) params.set("role", role);

    fetch(`/api/admin/users?${params}`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = (await response.json()) as AdminUsersResponse;
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError(t("loadError"));
      });

    return () => {
      active = false;
    };
  }, [page, role, search, t]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function changeRole(userId: string, nextRole: UserRole) {
    setPendingId(userId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        throw new Error(result.message);
      }
      await load();
    } catch {
      setError(t("saveError"));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <Card className="p-4 sm:p-5">
        <form
          onSubmit={submitSearch}
          className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]"
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            {t("searchLabel")}
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="min-h-12 rounded-lg border border-border bg-background px-4 font-normal outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            {t("filterLabel")}
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserRole | "");
                setPage(1);
              }}
              className="min-h-12 rounded-lg border border-border bg-background px-4 font-normal outline-none focus:border-accent"
            >
              <option value="">{t("allRoles")}</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {t(`roles.${item}`)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="self-end">
            {t("search")}
          </Button>
        </form>
      </Card>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {!data ? (
        <Card className="h-32 animate-pulse bg-surface-elevated">
          <span className="sr-only">{t("loading")}</span>
        </Card>
      ) : data.items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">{t("empty")}</Card>
      ) : (
        <section
          aria-label={t("listLabel")}
          className="grid gap-3 sm:grid-cols-2"
        >
          {data.items.map((user) => (
            <Card key={user.id} className="p-4 sm:p-5">
              <div className="min-w-0">
                <p className="truncate font-bold">
                  {user.athleteProfile?.displayName ?? user.email}
                </p>
                <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                {user.coachProfile ? (
                  <p className="mt-2 text-xs font-semibold text-accent">
                    {t("coachProfile")}
                  </p>
                ) : null}
              </div>
              <label className="mt-4 grid gap-1.5 text-sm font-semibold">
                {t("roleLabel")}
                <select
                  value={user.role}
                  disabled={pendingId !== null || user.id === currentUserId}
                  onChange={(event) =>
                    void changeRole(user.id, event.target.value as UserRole)
                  }
                  className="min-h-12 rounded-lg border border-border bg-background px-4 font-normal outline-none focus:border-accent disabled:opacity-60"
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {t(`roles.${item}`)}
                    </option>
                  ))}
                </select>
              </label>
              {pendingId === user.id ? (
                <p className="mt-2 text-xs text-muted" role="status">
                  {t("saving")}
                </p>
              ) : null}
              {user.id === currentUserId ? (
                <p className="mt-2 text-xs text-muted">{t("currentAdmin")}</p>
              ) : null}
            </Card>
          ))}
        </section>
      )}

      {data && data.pagination.totalPages > 1 ? (
        <nav
          aria-label={t("paginationLabel")}
          className="flex items-center justify-between gap-3"
        >
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t("previous")}
          </Button>
          <p className="text-sm text-muted">
            {t("page", {
              page: data.pagination.page,
              total: data.pagination.totalPages,
            })}
          </p>
          <Button
            variant="secondary"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("next")}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
