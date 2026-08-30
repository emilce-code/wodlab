import { NextResponse } from 'next/server';

import { authenticatedApiFetch } from '@/lib/api';

export async function GET() {
  const response =
    await authenticatedApiFetch(
      '/workouts/results/history',
    );

  if (!response) {
    return NextResponse.json(
      {
        message:
          'Unable to connect to API',
      },
      {
        status: 503,
      },
    );
  }

  const data =
    await response.json();

  return NextResponse.json(
    data,
    {
      status: response.status,
    },
  );
}