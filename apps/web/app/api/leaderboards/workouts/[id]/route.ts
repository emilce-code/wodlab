import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await authenticatedApiFetch(
    `/leaderboards/workouts/${encodeURIComponent(id)}?${request.nextUrl.searchParams.toString()}`,
  );

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  return NextResponse.json(await response.json(), { status: response.status });
}
