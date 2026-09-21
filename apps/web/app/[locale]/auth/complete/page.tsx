import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import ButtonLink from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { resolveCurrentUser } from "@/lib/auth";
import { safePostLoginPath } from "@/lib/auth-navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function AuthenticationCompletePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { returnTo: requestedReturnTo } = await searchParams;
  const destination = safePostLoginPath(locale, requestedReturnTo);
  const resolution = await resolveCurrentUser();

  if (resolution.status === "authenticated") redirect(destination);

  if (resolution.status === "unauthenticated") {
    const loginParams = new URLSearchParams({ returnTo: destination });
    redirect(`/${locale}/login?${loginParams.toString()}`);
  }

  const t = await getTranslations({ locale, namespace: "auth.complete" });
  const retryParams = new URLSearchParams({ returnTo: destination });

  return (
    <AuthShell>
      <div role="alert">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xl font-black text-amber-400"
        >
          !
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("description")}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={`/auth/complete?${retryParams.toString()}`}>
            {t("retry")}
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            {t("backToLogin")}
          </ButtonLink>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          {t("help")}{" "}
          <Link href="/" className="font-semibold text-accent">
            {t("home")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
