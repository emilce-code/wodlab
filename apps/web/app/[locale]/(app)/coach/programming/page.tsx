import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachProgrammingWorkspace from "../components/CoachProgrammingWorkspace";
import CoachModuleNavigation from "../components/CoachModuleNavigation";

export default async function CoachProgrammingPage() {
  const t = await getTranslations("coachProgramming");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachModuleNavigation />
      <CoachProgrammingWorkspace />
    </div>
  );
}
