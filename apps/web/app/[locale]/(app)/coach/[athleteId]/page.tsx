import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachAthleteDetail from "../components/CoachAthleteDetail";
import CoachModuleNavigation from "../components/CoachModuleNavigation";
import { requireRole } from "@/lib/auth";

type Props = { params: Promise<{ athleteId: string; locale: string }> };

export default async function CoachAthletePage({ params }: Props) {
  const [{ athleteId, locale }, t] = await Promise.all([
    params,
    getTranslations("coach"),
  ]);
  await requireRole(locale, ["COACH", "ADMIN"]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("athleteEyebrow")}
        title={t("athleteTitle")}
        description={t("athleteDescription")}
      />
      <CoachModuleNavigation />
      <CoachAthleteDetail athleteId={athleteId} />
    </div>
  );
}
