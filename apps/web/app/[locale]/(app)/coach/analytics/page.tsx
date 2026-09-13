import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachAnalyticsDashboard from "../components/CoachAnalyticsDashboard";
import CoachModuleNavigation from "../components/CoachModuleNavigation";
import { requireRole } from "@/lib/auth";

type Props = { params: Promise<{ locale: string }> };

export default async function CoachAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  await requireRole(locale, ["COACH", "ADMIN"]);
  const t = await getTranslations("coachAnalytics");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachModuleNavigation />
      <CoachAnalyticsDashboard />
    </div>
  );
}
