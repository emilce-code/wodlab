import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachWorkspace from "./components/CoachWorkspace";

export default async function CoachPage() {
  const t = await getTranslations("coach");
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <CoachWorkspace />
    </div>
  );
}
