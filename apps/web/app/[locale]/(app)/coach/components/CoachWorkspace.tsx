"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Card from "@/components/ui/Card";
import ProgressiveList from "@/components/ui/ProgressiveList";
import type { CoachWorkspace as Workspace } from "@/lib/coach";

import CoachModuleNavigation from "./CoachModuleNavigation";

export default function CoachWorkspace() {
  const t = useTranslations("coach");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/coach/workspace");
      if (!response.ok) throw new Error();
      setWorkspace((await response.json()) as Workspace);
    } catch {
      setError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    fetch("/api/coach/workspace")
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

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("activate");
    setError(null);
    try {
      const response = await fetch("/api/coach/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) return setError(t("saveError"));
      await load();
    } catch {
      setError(t("connectionError"));
    } finally {
      setPendingAction(null);
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("invite");
    setError(null);
    try {
      const response = await fetch("/api/coach/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: athleteEmail }),
      });
      if (!response.ok)
        return setError(
          response.status === 404 ? t("athleteNotFound") : t("inviteError"),
        );
      setAthleteEmail("");
      await load();
    } catch {
      setError(t("connectionError"));
    } finally {
      setPendingAction(null);
    }
  }

  async function respond(id: string, responseValue: "ACCEPT" | "DECLINE") {
    setPendingAction(`invitation-${id}`);
    setError(null);
    try {
      const response = await fetch(`/api/coach/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseValue }),
      });
      if (!response.ok) {
        setError(t("responseError"));
        return;
      }
      await load();
    } catch {
      setError(t("connectionError"));
    } finally {
      setPendingAction(null);
    }
  }

  async function disconnect(id: string) {
    if (!window.confirm(t("disconnectConfirm"))) return;
    setPendingAction(`relationship-${id}`);
    setError(null);
    try {
      const response = await fetch(`/api/coach/relationships/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) return setError(t("disconnectError"));
      await load();
    } catch {
      setError(t("connectionError"));
    } finally {
      setPendingAction(null);
    }
  }

  if (!workspace) {
    return error ? (
      <Alert variant="error" className="mt-8">
        {error}
      </Alert>
    ) : (
      <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-label={t("loading")}>
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="h-32 animate-pulse bg-surface-elevated">
            <span className="sr-only">{t("loading")}</span>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {workspace.coachProfile ? <CoachModuleNavigation /> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {workspace.receivedInvitations.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold">{t("invitationsTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {workspace.receivedInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-5">
                <p className="font-bold">
                  {invitation.coachProfile.displayName}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t("invitationDescription")}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    disabled={pendingAction !== null}
                    isLoading={pendingAction === `invitation-${invitation.id}`}
                    onClick={() => void respond(invitation.id, "ACCEPT")}
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingAction !== null}
                    onClick={() => void respond(invitation.id, "DECLINE")}
                  >
                    {t("decline")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {workspace.coaches.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold">{t("coachesTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {workspace.coaches.map((relationship) => (
              <Card key={relationship.id} className="p-5">
                <p className="font-bold">
                  {relationship.coachProfile.displayName}
                </p>
                {relationship.coachProfile.bio ? (
                  <p className="mt-2 text-sm text-muted">
                    {relationship.coachProfile.bio}
                  </p>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pendingAction !== null}
                  isLoading={
                    pendingAction === `relationship-${relationship.id}`
                  }
                  onClick={() => void disconnect(relationship.id)}
                  className="mt-4"
                >
                  {t("removeCoach")}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {!workspace.coachProfile ? (
        <Card className="p-6">
          <h2 className="text-xl font-bold">{t("activateTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("activateDescription")}</p>
          <form
            onSubmit={activate}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <input
              required
              maxLength={100}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("coachName")}
              className="min-h-12 flex-1 rounded-lg border border-border bg-background px-4 outline-none focus:border-accent"
            />
            <Button type="submit" isLoading={pendingAction === "activate"}>
              {t("activate")}
            </Button>
          </form>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="flex h-full flex-col p-6">
              <h2 className="text-xl font-bold">{t("programmingTitle")}</h2>
              <p className="mt-2 text-sm text-muted">
                {t("programmingDescription")}
              </p>
              <ButtonLink href="/coach/programming" className="mt-auto pt-5">
                {t("openProgramming")}
              </ButtonLink>
            </Card>

            <Card className="flex h-full flex-col p-6">
              <h2 className="text-xl font-bold">{t("monitoringTitle")}</h2>
              <p className="mt-2 text-sm text-muted">
                {t("monitoringDescription")}
              </p>
              <ButtonLink href="/coach/monitoring" className="mt-auto pt-5">
                {t("openMonitoring")}
              </ButtonLink>
            </Card>

            <Card className="flex h-full flex-col p-6">
              <h2 className="text-xl font-bold">{t("analyticsTitle")}</h2>
              <p className="mt-2 text-sm text-muted">
                {t("analyticsDescription")}
              </p>
              <ButtonLink href="/coach/analytics" className="mt-auto pt-5">
                {t("openAnalytics")}
              </ButtonLink>
            </Card>
          </section>

          <Card className="p-6">
            <h2 className="text-xl font-bold">{t("inviteTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("inviteDescription")}</p>
            <form
              onSubmit={invite}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={athleteEmail}
                onChange={(event) => setAthleteEmail(event.target.value)}
                placeholder={t("athleteEmail")}
                className="min-h-12 flex-1 rounded-lg border border-border bg-background px-4 outline-none focus:border-accent"
              />
              <Button type="submit" isLoading={pendingAction === "invite"}>
                {t("sendInvitation")}
              </Button>
            </form>
          </Card>

          <section>
            <h2 className="text-xl font-bold">{t("athletesTitle")}</h2>
            {workspace.athletes.length === 0 ? (
              <Card className="mt-4 p-8 text-center text-muted">
                {t("athletesEmpty")}
              </Card>
            ) : (
              <ProgressiveList
                initialCount={10}
                increment={10}
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                {workspace.athletes.map((relationship) => (
                  <Card key={relationship.id} className="p-5">
                    <p className="text-lg font-bold">
                      {relationship.athleteProfile.displayName}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {relationship.athleteProfile.user.email}
                    </p>
                    <ButtonLink
                      href={`/coach/${relationship.athleteProfile.id}`}
                      size="sm"
                      className="mt-4"
                    >
                      {t("openAthlete")}
                    </ButtonLink>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pendingAction !== null}
                      isLoading={
                        pendingAction === `relationship-${relationship.id}`
                      }
                      onClick={() => void disconnect(relationship.id)}
                      className="ml-2 mt-4"
                    >
                      {t("removeAthlete")}
                    </Button>
                  </Card>
                ))}
              </ProgressiveList>
            )}
          </section>

          {workspace.sentInvitations.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold">{t("pendingTitle")}</h2>
              <ProgressiveList
                initialCount={10}
                increment={10}
                className="mt-4 space-y-2"
              >
                {workspace.sentInvitations.map((relationship) => (
                  <Card key={relationship.id} className="p-4 text-sm">
                    {relationship.athleteProfile.displayName} ·{" "}
                    {relationship.athleteProfile.user.email}
                  </Card>
                ))}
              </ProgressiveList>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
