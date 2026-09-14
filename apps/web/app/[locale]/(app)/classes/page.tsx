import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetch } from "@/lib/api";
import type { BoxSummary } from "@/lib/boxes";
import ClassHub from "./components/ClassHub";

export default async function ClassesPage() {
  const t = await getTranslations("boxes");
  const response = await authenticatedApiFetch("/boxes");
  const boxes = response?.ok ? ((await response.json()) as BoxSummary[]) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <ClassHub initialBoxes={boxes} />
    </div>
  );
}
