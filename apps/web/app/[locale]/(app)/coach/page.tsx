import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";

import CoachWorkspace from "./components/CoachWorkspace";
import { getCurrentUser } from "@/lib/auth";

export default async function CoachPage() {
  const [t, user] = await Promise.all([
    getTranslations("coach"),
    getCurrentUser(),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CoachWorkspace
        canCoach={user?.permissions.includes("coach:use") ?? false}
      />
    </div>
  );
}
