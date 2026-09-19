import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth";

import CoachModuleNavigation from "../components/CoachModuleNavigation";
import CoachProgrammingWorkspace from "../components/CoachProgrammingWorkspace";

type Props = { params: Promise<{ locale: string }> };

export default async function CoachGroupsPage({ params }: Props) {
  const { locale } = await params;
  await requireRole(locale, ["COACH", "ADMIN"]);
  const t = await getTranslations("coachProgramming");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("groupsEyebrow")}
        title={t("groupsPageTitle")}
        description={t("groupsPageDescription")}
      />
      <CoachModuleNavigation />
      <CoachProgrammingWorkspace view="groups" />
    </div>
  );
}
