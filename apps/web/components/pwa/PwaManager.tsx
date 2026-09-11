"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  return navigator.onLine;
}

function getServerOnlineStatus() {
  return true;
}

export default function PwaManager() {
  const t = useTranslations("pwa");
  const online = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    getServerOnlineStatus,
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");

    const handleOnline = () => {
      navigator.serviceWorker.controller?.postMessage({ type: "FLUSH_QUEUE" });
    };
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data.type === "RESULT_SYNCED") setSyncMessage(t("synced"));
      if (event.data.type === "RESULT_SYNC_FAILED")
        setSyncMessage(t("syncFailed"));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("beforeinstallprompt", handleInstall);
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [t]);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (online && !installPrompt && !syncMessage) return null;
  return (
    <div
      className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[90] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-xl"
      role="status"
    >
      <span className="min-w-0 font-semibold">
        {!online ? t("offline") : (syncMessage ?? t("installDescription"))}
      </span>
      {installPrompt && online ? (
        <button
          type="button"
          onClick={() => void install()}
          className="min-h-10 shrink-0 rounded-lg bg-accent px-3 font-bold text-accent-foreground"
        >
          {t("install")}
        </button>
      ) : null}
      {syncMessage && online ? (
        <button
          type="button"
          onClick={() => setSyncMessage(null)}
          aria-label={t("dismiss")}
          className="min-h-10 px-2 text-muted"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
