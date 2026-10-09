import ClassDetailsPage from "../../components/ClassDetailsPage";
export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ boxId: string; classId: string }>;
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const [{ boxId, classId }, query] = await Promise.all([params, searchParams]);
  return (
    <ClassDetailsPage
      key={`${boxId}/${classId}`}
      boxId={boxId}
      classId={classId}
      day={query.day}
      view={query.view}
    />
  );
}
