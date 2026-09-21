import { getTranslations } from "next-intl/server";

import AuthShell from "@/components/auth/AuthShell";

export default async function AuthenticationCompleteLoading() {
  const t = await getTranslations("auth.complete");

  return (
    <AuthShell>
      <div className="text-center" role="status" aria-live="polite">
        <div
          aria-hidden="true"
          className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-border border-t-accent"
        />
        <h1 className="mt-6 text-2xl font-black tracking-tight">
          {t("loadingTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("loadingDescription")}
        </p>
      </div>
    </AuthShell>
  );
}
