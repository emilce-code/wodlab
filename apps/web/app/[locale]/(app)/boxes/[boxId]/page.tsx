import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import BoxDetailsView from "./components/BoxDetailsView";

type Props = {
  params: Promise<{
    boxId: string;
  }>;
};

export default async function BoxDetailsPage({ params }: Props) {
  const [{ boxId }, t] = await Promise.all([params, getTranslations("boxDetails")]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <BoxDetailsView boxId={boxId} />
    </div>
  );
}