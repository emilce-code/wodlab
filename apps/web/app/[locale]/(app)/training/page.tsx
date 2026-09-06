import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import TrainingCalendar from "./components/TrainingCalendar";

export default async function TrainingPage() {
  const t = await getTranslations("training");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <TrainingCalendar />
    </div>
  );
}
