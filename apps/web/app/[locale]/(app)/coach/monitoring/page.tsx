import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachMonitoringDashboard from "../components/CoachMonitoringDashboard";
import CoachModuleNavigation from "../components/CoachModuleNavigation";

export default async function CoachMonitoringPage() {
  const t = await getTranslations("coachMonitoring");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachModuleNavigation />
      <CoachMonitoringDashboard />
    </div>
  );
}
