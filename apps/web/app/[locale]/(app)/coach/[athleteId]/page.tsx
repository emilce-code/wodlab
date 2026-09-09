import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachAthleteDetail from "../components/CoachAthleteDetail";
import CoachModuleNavigation from "../components/CoachModuleNavigation";

type Props = { params: Promise<{ athleteId: string }> };

export default async function CoachAthletePage({ params }: Props) {
  const [{ athleteId }, t] = await Promise.all([
    params,
    getTranslations("coach"),
  ]);
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
