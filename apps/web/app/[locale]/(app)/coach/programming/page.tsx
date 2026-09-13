import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachProgrammingWorkspace from "../components/CoachProgrammingWorkspace";
import CoachModuleNavigation from "../components/CoachModuleNavigation";
import { requireRole } from "@/lib/auth";

type Props = { params: Promise<{ locale: string }> };

export default async function CoachProgrammingPage({ params }: Props) {
  const { locale } = await params;
  await requireRole(locale, ["COACH", "ADMIN"]);
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
