"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_PROMPT_DISMISSED_AT_KEY = "wodly:pwa-install-dismissed-at";
const INSTALL_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const INSTALL_GUIDE_DISMISSED_AT_KEY = "wodly:pwa-install-guide-dismissed-at";

type InstallGuideKind = "ios" | "android-chrome" | "xiaomi" | "android-other";

type InstallGuide = {
  key: InstallGuideKind;
  title: string;
  description: string;
  steps: string[];
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

function wasInstallPromptRecentlyDismissed() {
  const dismissedAt = Number(
    window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_AT_KEY),
  );

  return (
    Number.isFinite(dismissedAt) &&
    Date.now() - dismissedAt < INSTALL_PROMPT_COOLDOWN_MS
  );
}

function canUseBrowserInstallState() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function isStandalone() {
  if (!canUseBrowserInstallState()) return false;

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

function isMobileDevice() {
  if (!canUseBrowserInstallState()) return false;

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function preferredGuideKind(): InstallGuideKind {
  if (!canUseBrowserInstallState()) return "android-chrome";

  const userAgent = navigator.userAgent;
  const isiOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isChrome = /Chrome|CriOS/i.test(userAgent);
  const isXiaomi = /MiuiBrowser|XiaoMi|Miui/i.test(userAgent);

  if (isiOS) return "ios";
  if (isXiaomi) return "xiaomi";
  if (isAndroid && isChrome) return "android-chrome";
  return "android-other";
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
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guideKind, setGuideKind] =
    useState<InstallGuideKind>(preferredGuideKind);
  const [canShowInstallEducation, setCanShowInstallEducation] = useState(
    () =>
      isMobileDevice() &&
      !isStandalone() &&
      !wasInstallPromptRecentlyDismissed(),
  );

  const installGuides = useMemo<InstallGuide[]>(
    () => [
      {
        key: "ios",
        title: t("guide.ios.title"),
        description: t("guide.ios.description"),
        steps: [
          t("guide.ios.step1"),
          t("guide.ios.step2"),
          t("guide.ios.step3"),
        ],
      },
      {
        key: "android-chrome",
        title: t("guide.androidChrome.title"),
        description: t("guide.androidChrome.description"),
        steps: [
          t("guide.androidChrome.step1"),
          t("guide.androidChrome.step2"),
          t("guide.androidChrome.step3"),
        ],
      },
      {
        key: "xiaomi",
        title: t("guide.xiaomi.title"),
        description: t("guide.xiaomi.description"),
        steps: [
          t("guide.xiaomi.step1"),
          t("guide.xiaomi.step2"),
          t("guide.xiaomi.step3"),
        ],
      },
      {
        key: "android-other",
        title: t("guide.androidOther.title"),
        description: t("guide.androidOther.description"),
        steps: [
          t("guide.androidOther.step1"),
          t("guide.androidOther.step2"),
          t("guide.androidOther.step3"),
        ],
      },
    ],
    [t],
  );

  const selectedGuide =
    installGuides.find((guide) => guide.key === guideKind) ?? installGuides[0];

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");

    const handleOnline = () => {
      navigator.serviceWorker.controller?.postMessage({ type: "FLUSH_QUEUE" });
    };
    const handleInstall = (event: Event) => {
      event.preventDefault();

      if (!wasInstallPromptRecentlyDismissed()) {
        setInstallPrompt(event as InstallPromptEvent);
      }
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

  function dismissInstallPrompt() {
    window.localStorage.setItem(
      INSTALL_PROMPT_DISMISSED_AT_KEY,
      Date.now().toString(),
    );
    window.localStorage.setItem(
      INSTALL_GUIDE_DISMISSED_AT_KEY,
      Date.now().toString(),
    );
    setInstallPrompt(null);
    setShowInstallGuide(false);
    setCanShowInstallEducation(false);
  }

  function openInstallGuide() {
    setShowInstallGuide(true);
  }

  function closeInstallGuide() {
    setShowInstallGuide(false);
  }

  const showInstallEducation =
    online && canShowInstallEducation && !syncMessage;

  if (online && !showInstallEducation && !syncMessage && !showInstallGuide)
    return null;

  return (
    <>
      <div
        className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[90] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-xl"
        role="status"
      >
        <span className="min-w-0 font-semibold">
          {!online ? t("offline") : (syncMessage ?? t("installDescription"))}
        </span>
        {showInstallEducation ? (
          <div className="flex shrink-0 items-center gap-1">
            {installPrompt ? (
              <button
                type="button"
                onClick={() => void install()}
                className="min-h-11 rounded-lg bg-accent px-3 font-bold text-accent-foreground"
              >
                {t("install")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={openInstallGuide}
              className="min-h-11 rounded-lg px-3 font-bold text-accent"
            >
              {t("howToInstall")}
            </button>
            <button
              type="button"
              onClick={dismissInstallPrompt}
              aria-label={t("dismiss")}
              className="min-h-11 min-w-11 rounded-lg text-xl text-muted"
            >
              x
            </button>
          </div>
        ) : null}
        {syncMessage && online ? (
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            aria-label={t("dismiss")}
            className="min-h-11 min-w-11 rounded-lg text-xl text-muted"
          >
            x
          </button>
        ) : null}
      </div>

      {showInstallGuide ? (
        <div className="fixed inset-0 z-[100] bg-black/45 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-16 sm:flex sm:items-center sm:justify-center">
          <section
            aria-modal="true"
            role="dialog"
            aria-labelledby="pwa-install-guide-title"
            className="mx-auto max-h-[calc(100dvh-5rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-surface p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  {t("guide.eyebrow")}
                </p>
                <h2
                  id="pwa-install-guide-title"
                  className="mt-1 text-xl font-black"
                >
                  {t("guide.title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeInstallGuide}
                aria-label={t("guide.close")}
                className="min-h-11 min-w-11 rounded-xl text-xl text-muted"
              >
                x
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div
                role="tablist"
                aria-label={t("guide.deviceTabs")}
                className="grid grid-cols-2 gap-2"
              >
                {installGuides.map((guide) => (
                  <button
                    key={guide.key}
                    type="button"
                    role="tab"
                    aria-selected={guide.key === guideKind}
                    onClick={() => setGuideKind(guide.key)}
                    className={`min-h-12 rounded-xl border px-3 text-left text-sm font-bold ${
                      guide.key === guideKind
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-surface-elevated text-foreground"
                    }`}
                  >
                    {guide.title}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                <p className="text-sm leading-6 text-muted">
                  {selectedGuide.description}
                </p>

                <ol className="mt-4 space-y-3">
                  {selectedGuide.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-accent-foreground">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-sm font-semibold leading-6">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                {installPrompt && guideKind === "android-chrome" ? (
                  <button
                    type="button"
                    onClick={() => void install()}
                    className="mt-5 min-h-12 w-full rounded-xl bg-accent px-4 font-black text-accent-foreground"
                  >
                    {t("install")}
                  </button>
                ) : null}
              </div>

              <p className="text-center text-xs leading-5 text-muted">
                {t("guide.note")}
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
