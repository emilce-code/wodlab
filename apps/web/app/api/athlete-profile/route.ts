import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  authenticatedApiFetch,
} from '@/lib/api';

export async function GET() {
  const response =
    await authenticatedApiFetch(
      '/athlete-profile',
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

export async function PATCH(
  request: NextRequest,
) {
  const body =
    await request.json();

  const response =
    await authenticatedApiFetch(
      '/athlete-profile',
      {
        method: 'PATCH',

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