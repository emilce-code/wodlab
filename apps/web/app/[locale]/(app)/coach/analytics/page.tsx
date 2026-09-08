import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachAnalyticsDashboard from "../components/CoachAnalyticsDashboard";

export default async function CoachAnalyticsPage() {
  const t = await getTranslations("coachAnalytics");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachAnalyticsDashboard />
    </div>
  );
}
