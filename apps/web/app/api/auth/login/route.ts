import { NextRequest, NextResponse } from 'next/server';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    athleteProfile: {
      id: string;
      displayName: string;
      preferredWeightUnit: 'KG' | 'LB';
    } | null;
  };
};

export async function POST(request: NextRequest) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { message: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    const login = data as LoginResponse;

    const nextResponse = NextResponse.json({
      user: login.user,
    });

    nextResponse.cookies.set({
      name: 'wodlab_access_token',
      value: login.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: 'Unable to connect to the API' },
      { status: 502 },
    );
  }
}