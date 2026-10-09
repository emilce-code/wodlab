import ClassHub from "./components/ClassHub";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="mx-auto max-w-6xl">
      <ClassHub initialDay={query.day} initialView={query.view} />
    </div>
  );
}
