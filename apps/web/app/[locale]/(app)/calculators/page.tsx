import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetch } from "@/lib/api";
import type { WeightUnit } from "@/lib/result-types";

import WeightPercentageCalculator from "./components/WeightPercentageCalculator";

async function preferredUnit(): Promise<WeightUnit> {
  const response = await authenticatedApiFetch("/athlete-profile");
  if (!response?.ok) return "KG";
  const profile = (await response.json()) as {
    preferredWeightUnit?: WeightUnit;
  };
  return profile.preferredWeightUnit ?? "KG";
}

export default async function CalculatorsPage() {
  const [t, unit] = await Promise.all([
    getTranslations("calculators"),
    preferredUnit(),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <WeightPercentageCalculator preferredUnit={unit} />
    </div>
  );
}
