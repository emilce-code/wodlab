import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetchJson } from "@/lib/api";

import HistoryList, {
  type TrainingHistoryItem,
} from "./components/HistoryList";

type TrainingHistoryResponse = {
  items: TrainingHistoryItem[];
};

async function getHistory(): Promise<TrainingHistoryItem[]> {
  const data =
    await authenticatedApiFetchJson<TrainingHistoryResponse>(
      "/training/history",
    );

  return data.items ?? [];
}

export default async function HistoryPage() {
  const t = await getTranslations("history");
  const results = await getHistory();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <HistoryList results={results} />
    </div>
  );
}
