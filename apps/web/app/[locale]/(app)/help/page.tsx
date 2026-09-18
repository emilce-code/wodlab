import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import HelpGuide from "./components/HelpGuide";

export default async function HelpPage() {
  const t = await getTranslations("help");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <HelpGuide />
    </div>
  );
}
