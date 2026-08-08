import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authenticatedApiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type ReferenceOption = {
  key: string;
  name: string;
};

type Movement = {
  id: string;
  name: string;
  isFoundational: boolean;
  official: boolean;
  aliases: string[];

  category: {
    key: string;
    name: string;
  };

  measurementTypes: {
    key: string;
    name: string;
  }[];
};

type MovementsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    measurementType?: string;
    foundational?: string;
  }>;
};

async function getMovements(
  params: Awaited<MovementsPageProps['searchParams']>,
): Promise<Movement[]> {
  const query = new URLSearchParams();

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.category) {
    query.set('category', params.category);
  }

  if (params.measurementType) {
    query.set('measurementType', params.measurementType);
  }

  if (params.foundational === 'true') {
    query.set('foundational', 'true');
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';

  const response = await authenticatedApiFetch(`/movements${suffix}`);

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as Movement[];
}

async function getCategories(): Promise<ReferenceOption[]> {
  const response = await authenticatedApiFetch('/movements/categories');

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as ReferenceOption[];
}

async function getMeasurementTypes(): Promise<ReferenceOption[]> {
  const response = await authenticatedApiFetch('/movements/measurement-types');

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as ReferenceOption[];
}

export default async function MovementsPage({
  searchParams,
}: MovementsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;

  const [movements, categories, measurementTypes] = await Promise.all([
    getMovements(params),
    getCategories(),
    getMeasurementTypes(),
  ]);

  const hasFilters =
    Boolean(params.search) ||
    Boolean(params.category) ||
    Boolean(params.measurementType) ||
    params.foundational === 'true';

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Movement Library
            </h1>

            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Browse and filter the movements available in WODLab.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            Dashboard
          </Link>
        </header>

        <form
          method="GET"
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="mb-1.5 block text-sm font-medium"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                type="search"
                defaultValue={params.search ?? ''}
                placeholder="Search movements..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-medium"
              >
                Category
              </label>

              <select
                id="category"
                name="category"
                defaultValue={params.category ?? ''}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-600"
              >
                <option value="">All categories</option>

                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="measurementType"
                className="mb-1.5 block text-sm font-medium"
              >
                Measurement
              </label>

              <select
                id="measurementType"
                name="measurementType"
                defaultValue={params.measurementType ?? ''}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-600"
              >
                <option value="">All measurements</option>

                {measurementTypes.map((measurementType) => (
                  <option
                    key={measurementType.key}
                    value={measurementType.key}
                  >
                    {measurementType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="foundational"
                value="true"
                defaultChecked={params.foundational === 'true'}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              />

              Foundational only
            </label>

            <div className="flex gap-3">
              {hasFilters && (
                <Link
                  href="/movements"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Clear filters
                </Link>
              )}

              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Apply filters
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {movements.length}{' '}
            {movements.length === 1 ? 'movement' : 'movements'}
          </p>
        </div>

        {movements.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <h2 className="font-semibold">No movements found</h2>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Try changing or clearing your filters.
            </p>
          </div>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {movements.map((movement) => (
              <article
                key={movement.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{movement.name}</h2>

                  {movement.isFoundational && (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Foundational
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="inline-flex rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                    {movement.category.name}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {movement.measurementTypes.map((measurementType) => (
                    <span
                      key={measurementType.key}
                      className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {measurementType.name}
                    </span>
                  ))}
                </div>

                {movement.aliases.length > 0 && (
                  <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Also known as: {movement.aliases.join(', ')}
                  </p>
                )}

                {!movement.official && (
                  <p className="mt-3 text-xs text-zinc-500">
                    WODLab movement
                  </p>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}