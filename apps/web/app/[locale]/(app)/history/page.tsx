import { getTranslations } from "next-intl/server";

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
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          {t("title")}
        </h1>

        <p className="mt-4 max-w-2xl text-muted">{t("description")}</p>
      </header>

      <HistoryList results={results} />
    </div>
  );
}
