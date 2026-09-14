import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type { BoxSummary, ManagedBox } from "@/lib/boxes";
import BoxAdministration from "./BoxAdministration";

type Props = { params: Promise<{ locale: string }> };

export default async function BoxAdministrationPage({ params }: Props) {
  const { locale } = await params;
  const [t, user] = await Promise.all([
    getTranslations("boxAdministration"),
    getCurrentUser(),
  ]);
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = user.role === "ADMIN";
  const response = await authenticatedApiFetch(
    isAdmin ? "/boxes/administration" : "/boxes",
  );
  const allBoxes = response?.ok
    ? ((await response.json()) as ManagedBox[])
    : [];
  const boxes = isAdmin
    ? allBoxes
    : (allBoxes as BoxSummary[]).filter((box) => box.role === "OWNER");

  if (!isAdmin && boxes.length === 0) redirect(`/${locale}/classes`);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <BoxAdministration initialBoxes={boxes} isApplicationAdmin={isAdmin} />
    </div>
  );
}
