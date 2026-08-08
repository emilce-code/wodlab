type HealthResponse = {
  status: string;
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

  const isConnected = health?.status === 'ok';

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">WODLab</h1>

        <p className="mt-4">
          API status:{' '}
          <strong>{isConnected ? 'Connected' : 'Disconnected'}</strong>
        </p>
      </div>
    </main>
  );
}