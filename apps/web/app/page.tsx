type HealthResponse = {
  status: string;
  database: string;
};

async function getApiHealth(): Promise<HealthResponse | null> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    console.error('API_URL is not configured');
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthResponse;
  } catch (error) {
    console.error('Unable to connect to API:', error);
    return null;
  }
}

export default async function Home() {
  const health = await getApiHealth();

  const isApiConnected = health?.status === 'ok';
  const isDatabaseConnected = health?.database === 'connected';

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">WODLab</h1>

        <div className="mt-4 space-y-2">
          <p>
            API status:{' '}
            <strong>
              {isApiConnected ? 'Connected' : 'Disconnected'}
            </strong>
          </p>

          <p>
            Database status:{' '}
            <strong>
              {isDatabaseConnected ? 'Connected' : 'Disconnected'}
            </strong>
          </p>
        </div>
      </div>
    </main>
  );
}