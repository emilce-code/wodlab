import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("pwa");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-5 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
          ↯
        </div>
        <h1 className="mt-5 text-2xl font-black">{t("offlineTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("offlineDescription")}
        </p>
        <a
          href=""
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 font-bold text-accent-foreground"
        >
          {t("retry")}
        </a>
      </section>
    </main>
  );
}
