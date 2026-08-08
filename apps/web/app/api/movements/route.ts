import { NextRequest, NextResponse } from 'next/server';

import { authenticatedApiFetch } from '@/lib/api';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')?.trim();

  const query = new URLSearchParams();

  if (search) {
    query.set('search', search);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';

  const response = await authenticatedApiFetch(
    `/movements${suffix}`,
  );

  if (!response) {
    return NextResponse.json(
      { message: 'Unable to connect to API' },
      { status: 503 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: 'Unable to retrieve movements' },
      { status: response.status },
    );
  }

  const movements = await response.json();

  return NextResponse.json(movements);
}