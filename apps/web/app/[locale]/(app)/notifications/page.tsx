import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import { authenticatedApiFetch } from "@/lib/api";
import type { NotificationResponse } from "@/lib/notifications";
import NotificationCenter from "./components/NotificationCenter";

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");
  const response = await authenticatedApiFetch("/notifications", {
    cache: "no-store",
  });
  const initialData = response?.ok
    ? ((await response.json()) as NotificationResponse)
    : null;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <NotificationCenter initialData={initialData} />
    </div>
  );
}
