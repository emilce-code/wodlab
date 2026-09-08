import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachProgrammingWorkspace from "../components/CoachProgrammingWorkspace";

export default async function CoachProgrammingPage() {
  const t = await getTranslations("coachProgramming");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachProgrammingWorkspace />
    </div>
  );
}
