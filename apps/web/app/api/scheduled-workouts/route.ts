import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `/scheduled-workouts?${query}` : "/scheduled-workouts";
  const response = await authenticatedApiFetch(path);

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await authenticatedApiFetch("/scheduled-workouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
