import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth";

import UserRoleManager from "./UserRoleManager";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const [user, t] = await Promise.all([
    requireRole(locale, ["ADMIN"]),
    getTranslations("adminUsers"),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <UserRoleManager currentUserId={user.id} />
    </div>
  );
}
