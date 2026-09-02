import { getTranslations } from "next-intl/server";

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
    <div>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-xl text-muted">{t("description")}</p>
      </header>

      <MovementLibrary initialMovements={movements} />
    </div>
  );
}
