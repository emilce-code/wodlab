import { getLocale, getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetchJson } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/pagination";

import MovementLibrary from "./components/MovementLibrary";
import type { Movement } from "./components/MovementCard";

type Option = { key: string; name: string };

async function getMovements(
  locale: string,
): Promise<PaginatedResponse<Movement>> {
  return authenticatedApiFetchJson<PaginatedResponse<Movement>>(
    "/movements?page=1&pageSize=12",
    {
      headers: { "Accept-Language": locale },
    },
  );
}

async function getOptions(path: string): Promise<Option[]> {
  return authenticatedApiFetchJson<Option[]>(path);
}

export default async function MovementsPage() {
  const [t, locale] = await Promise.all([
    getTranslations("movements"),
    getLocale(),
  ]);

  const [movements, categories, measurementTypes] = await Promise.all([
    getMovements(locale),
    getOptions("/movements/categories"),
    getOptions("/movements/measurement-types"),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <MovementLibrary
        initialMovements={movements}
        categories={categories}
        measurementTypes={measurementTypes}
      />
    </div>
  );
}
