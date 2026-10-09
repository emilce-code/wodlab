import { getTranslations } from "next-intl/server";
import { authenticatedApiFetch } from "@/lib/api";
import type { ManagedBox } from "@/lib/boxes";
import { Link } from "@/i18n/navigation";
import BoxDetailsView from "./components/BoxDetailsView";
export default async function BoxDetailsPage({
  params,
}: {
  params: Promise<{ boxId: string }>;
}) {
  const { boxId } = await params;
  const response = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
  );
  const t = await getTranslations("boxDetailsV4");
  if (!response?.ok)
    return (
      <div role="alert" className="py-6">
        <p>{t("loadError")}</p>
        <Link href="/classes" className="mt-4 inline-block text-accent">
          {t("classes")}
        </Link>
      </div>
    );
  const box = (await response.json()) as ManagedBox;
  return (
    <div className="mx-auto max-w-xl py-6">
      <BoxDetailsView key={box.id} box={box} />
    </div>
  );
}
