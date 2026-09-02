import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetchJson } from "@/lib/api";

import MovementLibrary from "./components/MovementLibrary";
import type { Movement } from "./components/MovementCard";

async function getMovements(): Promise<Movement[]> {
  return authenticatedApiFetchJson<Movement[]>("/movements");
}

export default async function MovementsPage() {
  const t = await getTranslations("movements");

  const movements = await getMovements();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <MovementLibrary initialMovements={movements} />
    </div>
  );
}
