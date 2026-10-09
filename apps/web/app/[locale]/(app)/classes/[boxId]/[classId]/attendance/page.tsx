import StaffClassPage from "../../../components/StaffClassPage";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ boxId: string; classId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const [{ boxId, classId }, query] = await Promise.all([params, searchParams]);
  return (
    <StaffClassPage
      key={`${boxId}/${classId}`}
      boxId={boxId}
      classId={classId}
      mode="attendance"
      day={query.day}
    />
  );
}
