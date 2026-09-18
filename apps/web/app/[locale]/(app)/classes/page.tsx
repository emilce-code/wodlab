import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import ClassHub from "./components/ClassHub";

export default async function ClassesPage() {
  const t = await getTranslations("boxes");
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <ClassHub />
    </div>
  );
}
