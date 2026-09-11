import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  const allowedParameters = [
    "search",
    "category",
    "measurementType",
    "foundational",
    "page",
    "pageSize",
  ];

  for (const parameter of allowedParameters) {
    const value = request.nextUrl.searchParams.get(parameter)?.trim();
    if (value) query.set(parameter, value);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await authenticatedApiFetch(`/movements${suffix}`);

  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "Unable to retrieve movements" },
      { status: response.status },
    );
  }

  const movements = await response.json();

  return NextResponse.json(movements);
}

export async function POST(request: NextRequest) {
  const response = await authenticatedApiFetch("/movements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json()),
  });
  if (!response) {
    return NextResponse.json(
      { message: "Unable to connect to API" },
      { status: 503 },
    );
  }
  return NextResponse.json(await response.json(), { status: response.status });
}
