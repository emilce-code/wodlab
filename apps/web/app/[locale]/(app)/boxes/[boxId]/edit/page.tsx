import { notFound, redirect } from "next/navigation";
import { authenticatedApiFetch } from "@/lib/api";
import type { ManagedBox } from "@/lib/boxes";
import BoxDetailsEditor from "./BoxDetailsEditor";
export default async function EditBoxPage({
  params,
}: {
  params: Promise<{ boxId: string; locale: string }>;
}) {
  const { boxId, locale } = await params;
  const response = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
  );
  if (!response?.ok) notFound();
  const box = (await response.json()) as ManagedBox;
  if (!box.canEditDetails)
    redirect(`/${locale}/boxes/${encodeURIComponent(boxId)}`);
  return <BoxDetailsEditor key={box.id} initialBox={box} />;
}
