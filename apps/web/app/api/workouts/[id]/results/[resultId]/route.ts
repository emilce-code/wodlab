import { NextRequest, NextResponse } from 'next/server';

import { authenticatedApiFetch } from '@/lib/api';

type RouteContext = {
  params: Promise<{
    id: string;
    resultId: string;
  }>;
};

async function forwardResponse(response: Response | null) {
  if (!response) {
    return NextResponse.json(
      {
        message: 'Unable to connect to API',
      },
      {
        status: 503,
      },
    );
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  }

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
  });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const { id, resultId } = await context.params;
  const body = await request.json();

  const response = await authenticatedApiFetch(
    `/workouts/${id}/results/${resultId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  return forwardResponse(response);
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  const { id, resultId } = await context.params;

  const response = await authenticatedApiFetch(
    `/workouts/${id}/results/${resultId}`,
    {
      method: 'DELETE',
    },
  );

  return forwardResponse(response);
}