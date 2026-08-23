import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  authenticatedApiFetch,
} from '@/lib/api';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { id } =
    await context.params;

  const response =
    await authenticatedApiFetch(
      `/movements/${id}/results`,
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
      status:
        response.status,
    },
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } =
    await context.params;

  const body =
    await request.json();

  const response =
    await authenticatedApiFetch(
      `/movements/${id}/results`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            body,
          ),
      },
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
      status:
        response.status,
    },
  );
}